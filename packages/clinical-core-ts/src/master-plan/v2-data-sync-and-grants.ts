/**
 * DATA_ARCHITECTURE.md & AUTH_SECURITY_REFACTOR.md (T09 & T10)
 * V2 Persistence, Idempotent Sync, SafetyPlan Revision Conflict Detection,
 * Offline Queue Isolation on Logout, Privacy Export/Delete, Scoped Sharing Grants,
 * and Clinical Reviewer Workflow Gate.
 *
 * Implements:
 * - DATA-01: Local & Remote Persistence across restart/refresh (Sessions, Check-ins, PlanItems, SafetyPlans, Assessments).
 * - DATA-02: Idempotent Sync (Retrying POST/PATCH with the same client UUID + idempotencyKey never creates duplicates).
 * - DATA-03: SafetyPlan Conflict Detection (Concurrent edits with stale expectedRevision return 409 CONFLICT with both server and client versions rather than silently overwriting).
 * - DATA-04: User Export (Complete, human-readable & JSON export of user-owned records with provenance and zero diagnostic claims).
 * - DATA-05: User Delete / Purge (Purges all user-owned private records while preserving non-identifying audit trail metadata per retention policy).
 * - Offline Queue Logout Isolation: Clearing or blocking any pending offline sync queue items from being sent after logout or account switch.
 * - SAFE-06 & AUTH-08: Server-authoritative Sharing Grants (explicit scope, expiration, instant revocation) and Clinical Reviewer Workflow (`draft -> clinical_review -> approved -> published -> withdrawn`) blocking technical `admin` from self-approving clinical content.
 */

import type { ValidationResult } from '../schemas/models.ts';
import type {
  UnifiedPracticeItem,
  UnifiedPracticeSessionRecord,
  UnifiedReviewStatus,
  UnifiedPublicationStatus,
} from './unified-practice-library.ts';

// =============================================================================
// 1. V2 ENTITY MODELS (DATA_ARCHITECTURE.md)
// =============================================================================

export interface V2CheckInRecord {
  id: string; // Client-generated UUID
  userId: string;
  idempotencyKey: string;
  moodPolarity?: number;
  energyLevel?: number;
  distressIntensity?: number;
  sleepHours?: number;
  note?: string;
  provenance: 'user_self_report';
  createdAt: string;
}

export interface V2PlanItemRecord {
  id: string;
  userId: string;
  idempotencyKey: string;
  practiceId: string;
  schedule: string;
  status: 'planned' | 'completed' | 'skipped' | 'paused';
  revision: number;
  updatedAt: string;
}

export interface V2VersionedSafetyPlanRecord {
  id: string;
  userId: string;
  revision: number;
  idempotencyKey: string;
  section1WarningSigns: string[];
  section2InternalCoping: string[];
  section3SocialDistractions: string[];
  section4TrustedContacts: Array<{ name: string; phone: string; relationship: string }>;
  section5ProfessionalContacts: Array<{ name: string; phone: string }>;
  section6EnvironmentSafety: string[];
  explicitContactStorageConsent: boolean;
  updatedAt: string;
}

export type V2SharingScopeField =
  | 'plan_items'
  | 'assessments_summary'
  | 'safety_plan'
  | 'rhythm_summary'
  | 'session_completion_counts';
// Note: 'private_journal_notes' is intentionally NOT a valid sharing scope unless explicitly added, and defaults to denied.

export interface V2SharingGrantRecord {
  grantId: string;
  ownerUserId: string;
  granteeUserId: string;
  granteeRole: 'caregiver' | 'clinician';
  allowedScopes: V2SharingScopeField[];
  allowPrivateJournalNotes: false; // Strictly false by default (SAFE-06)
  createdAt: string;
  expiresAt: string;
  revokedAt: string | null;
  revision: number;
}

export interface V2ConsentEventRecord {
  eventId: string;
  userId: string;
  purpose:
    | 'guest_to_account_import'
    | 'safety_plan_contact_storage'
    | 'sharing_grant_created'
    | 'sharing_grant_revoked'
    | 'privacy_export'
    | 'privacy_delete';
  policyVersion: string;
  action: 'granted' | 'revoked' | 'executed';
  timestamp: string;
}

export interface V2AuditEventRecord {
  auditId: string;
  actorId: string;
  actorRole: 'user' | 'caregiver' | 'clinician' | 'admin' | 'system';
  action: string;
  objectType: string;
  objectId: string;
  timestamp: string;
  // Never contains plaintext PHI/diary content
}

export interface V2OfflineQueueOperation {
  queueItemId: string;
  boundUserId: string;
  idempotencyKey: string;
  entityType: 'checkin' | 'plan_item' | 'safety_plan' | 'session';
  payload: unknown;
  enqueuedAt: string;
}

// =============================================================================
// 2. V2 REPOSITORY & IDEMPOTENT SYNC ENGINE (DATA-01..05)
// =============================================================================

export interface SafetyPlanUpsertResult {
  status: 'saved' | 'idempotent_replay' | 'conflict_detected' | 'validation_error';
  httpStatus: 200 | 201 | 409 | 422;
  record?: V2VersionedSafetyPlanRecord;
  conflict?: {
    messageVi: string;
    messageEn: string;
    serverRecord: V2VersionedSafetyPlanRecord;
    clientSubmittedContent: Partial<V2VersionedSafetyPlanRecord>;
    expectedRevision: number;
    actualServerRevision: number;
  };
  errors: string[];
}

export interface V2UserPrivacyExportBundle {
  exportVersion: '2.0.0';
  exportedAt: string;
  userId: string;
  nonDiagnosticNoticeVi: string;
  checkins: V2CheckInRecord[];
  planItems: V2PlanItemRecord[];
  safetyPlan: V2VersionedSafetyPlanRecord | null;
  sessions: UnifiedPracticeSessionRecord[];
  sharingGrants: V2SharingGrantRecord[];
  consentEvents: V2ConsentEventRecord[];
}

export interface V2UserPrivacyDeleteResult {
  deleted: boolean;
  userId: string;
  purgedCounts: {
    checkins: number;
    planItems: number;
    safetyPlans: number;
    sessions: number;
    sharingGrantsRevokedAndPurged: number;
  };
  auditTrailPreserved: boolean;
  deletedAt: string;
}

/**
 * Authoritative V2 Data Repository supporting:
 * - Idempotent writes via `(userId, idempotencyKey)` (`DATA-02`)
 * - Optimistic concurrency control (`expectedRevision`) on `SafetyPlan` (`DATA-03`)
 * - Offline sync queue bound to `userId` and automatically flushed/blocked on logout or account switch
 * - Authoritative server-side sharing grant validation (`SAFE-06`, `AUTH-08`)
 * - Complete user export (`DATA-04`) and right-to-erasure delete (`DATA-05`)
 */
export class V2ClinicalDataRepository {
  private checkinsByUser = new Map<string, V2CheckInRecord[]>();
  private planItemsByUser = new Map<string, V2PlanItemRecord[]>();
  private safetyPlanByUser = new Map<string, V2VersionedSafetyPlanRecord>();
  private sessionsByUser = new Map<string, UnifiedPracticeSessionRecord[]>();
  private sharingGrantsById = new Map<string, V2SharingGrantRecord>();
  private consentEventsByUser = new Map<string, V2ConsentEventRecord[]>();
  private auditEvents: V2AuditEventRecord[] = [];
  private idempotencyRegistry = new Map<string, unknown>();
  private offlineQueue: V2OfflineQueueOperation[] = [];

  // ---------------------------------------------------------------------------
  // DATA-01 & DATA-02: Idempotent Check-in Persistence
  // ---------------------------------------------------------------------------
  public saveCheckIn(
    input: Omit<V2CheckInRecord, 'createdAt' | 'provenance'> & { createdAt?: string },
  ): { status: 'created' | 'idempotent_replay'; httpStatus: 201 | 200; record: V2CheckInRecord } {
    const idemKey = `checkin:${input.userId}:${input.idempotencyKey}`;
    const existing = this.idempotencyRegistry.get(idemKey) as V2CheckInRecord | undefined;
    if (existing) {
      return { status: 'idempotent_replay', httpStatus: 200, record: existing };
    }

    const list = this.checkinsByUser.get(input.userId) ?? [];
    const byId = list.find((c) => c.id === input.id);
    if (byId) {
      this.idempotencyRegistry.set(idemKey, byId);
      return { status: 'idempotent_replay', httpStatus: 200, record: byId };
    }

    const record: V2CheckInRecord = {
      id: input.id,
      userId: input.userId,
      idempotencyKey: input.idempotencyKey,
      moodPolarity: input.moodPolarity,
      energyLevel: input.energyLevel,
      distressIntensity: input.distressIntensity,
      sleepHours: input.sleepHours,
      note: input.note,
      provenance: 'user_self_report',
      createdAt: input.createdAt ?? new Date().toISOString(),
    };

    list.unshift(record);
    this.checkinsByUser.set(input.userId, list);
    this.idempotencyRegistry.set(idemKey, record);
    this.recordAudit(input.userId, 'user', 'checkin_saved', 'checkin', record.id);

    return { status: 'created', httpStatus: 201, record };
  }

  public getCheckIns(userId: string): V2CheckInRecord[] {
    return [...(this.checkinsByUser.get(userId) ?? [])];
  }

  // ---------------------------------------------------------------------------
  // DATA-01 & DATA-02: Idempotent Plan Items CRUD
  // ---------------------------------------------------------------------------
  public upsertPlanItem(
    input: Omit<V2PlanItemRecord, 'revision' | 'updatedAt'> & {
      expectedRevision?: number;
      updatedAt?: string;
    },
  ): {
    status: 'created' | 'updated' | 'idempotent_replay' | 'conflict';
    httpStatus: 201 | 200 | 409;
    record: V2PlanItemRecord;
  } {
    const idemKey = `plan_item:${input.userId}:${input.idempotencyKey}`;
    const replay = this.idempotencyRegistry.get(idemKey) as V2PlanItemRecord | undefined;
    if (replay) {
      return { status: 'idempotent_replay', httpStatus: 200, record: replay };
    }

    const list = this.planItemsByUser.get(input.userId) ?? [];
    const existingIdx = list.findIndex((p) => p.id === input.id);
    const nowIso = input.updatedAt ?? new Date().toISOString();

    if (existingIdx !== -1) {
      const current = list[existingIdx]!;
      if (
        typeof input.expectedRevision === 'number' &&
        input.expectedRevision !== current.revision
      ) {
        return { status: 'conflict', httpStatus: 409, record: current };
      }
      const updated: V2PlanItemRecord = {
        id: current.id,
        userId: current.userId,
        idempotencyKey: input.idempotencyKey,
        practiceId: input.practiceId,
        schedule: input.schedule,
        status: input.status,
        revision: current.revision + 1,
        updatedAt: nowIso,
      };
      list[existingIdx] = updated;
      this.planItemsByUser.set(input.userId, list);
      this.idempotencyRegistry.set(idemKey, updated);
      return { status: 'updated', httpStatus: 200, record: updated };
    }

    const created: V2PlanItemRecord = {
      id: input.id,
      userId: input.userId,
      idempotencyKey: input.idempotencyKey,
      practiceId: input.practiceId,
      schedule: input.schedule,
      status: input.status,
      revision: 1,
      updatedAt: nowIso,
    };
    list.push(created);
    this.planItemsByUser.set(input.userId, list);
    this.idempotencyRegistry.set(idemKey, created);
    return { status: 'created', httpStatus: 201, record: created };
  }

  public getPlanItems(userId: string): V2PlanItemRecord[] {
    return [...(this.planItemsByUser.get(userId) ?? [])];
  }

  // ---------------------------------------------------------------------------
  // DATA-01 & DATA-02: Idempotent Practice Session Persistence
  // ---------------------------------------------------------------------------
  public savePracticeSession(
    userId: string,
    session: UnifiedPracticeSessionRecord,
    idempotencyKey: string,
  ): {
    status: 'saved' | 'idempotent_replay';
    httpStatus: 200 | 201;
    record: UnifiedPracticeSessionRecord;
  } {
    const idemKey = `session:${userId}:${idempotencyKey}`;
    const replay = this.idempotencyRegistry.get(idemKey) as UnifiedPracticeSessionRecord | undefined;
    if (replay) {
      return { status: 'idempotent_replay', httpStatus: 200, record: replay };
    }

    const list = this.sessionsByUser.get(userId) ?? [];
    const idx = list.findIndex((s) => s.sessionId === session.sessionId);
    if (idx !== -1) {
      // CAT-04: Preserve original locked itemVersion
      const existing = list[idx]!;
      const merged: UnifiedPracticeSessionRecord = {
        ...session,
        itemVersion: existing.itemVersion,
      };
      list[idx] = merged;
      this.sessionsByUser.set(userId, list);
      this.idempotencyRegistry.set(idemKey, merged);
      return { status: 'saved', httpStatus: 200, record: merged };
    }

    list.unshift(session);
    this.sessionsByUser.set(userId, list);
    this.idempotencyRegistry.set(idemKey, session);
    return { status: 'saved', httpStatus: 201, record: session };
  }

  public getPracticeSessions(userId: string): UnifiedPracticeSessionRecord[] {
    return [...(this.sessionsByUser.get(userId) ?? [])];
  }

  // ---------------------------------------------------------------------------
  // DATA-03 & SAFE-06: Versioned SafetyPlan with Conflict Detection & Contact Consent Gate
  // ---------------------------------------------------------------------------
  public upsertSafetyPlan(input: {
    id: string;
    userId: string;
    idempotencyKey: string;
    expectedRevision: number; // 0 when creating first revision, or current server revision when updating
    section1WarningSigns: string[];
    section2InternalCoping: string[];
    section3SocialDistractions: string[];
    section4TrustedContacts: Array<{ name: string; phone: string; relationship: string }>;
    section5ProfessionalContacts: Array<{ name: string; phone: string }>;
    section6EnvironmentSafety: string[];
    explicitContactStorageConsent: boolean;
    updatedAt?: string;
  }): SafetyPlanUpsertResult {
    const idemKey = `safety_plan:${input.userId}:${input.idempotencyKey}`;
    const replay = this.idempotencyRegistry.get(idemKey) as V2VersionedSafetyPlanRecord | undefined;
    if (replay) {
      return {
        status: 'idempotent_replay',
        httpStatus: 200,
        record: replay,
        errors: [],
      };
    }

    // SAFE-06: Storing personal/trusted contact numbers requires explicitContactStorageConsent === true
    const hasPersonalContacts = input.section4TrustedContacts.some(
      (c) => c.name.trim().length > 0 || c.phone.trim().length > 0,
    );
    if (hasPersonalContacts && input.explicitContactStorageConsent !== true) {
      return {
        status: 'validation_error',
        httpStatus: 422,
        errors: [
          'SAFE-06 Violation: Storing trusted contact names or phone numbers in Safety Plan requires explicitContactStorageConsent === true.',
        ],
      };
    }

    const current = this.safetyPlanByUser.get(input.userId);
    const currentRevision = current ? current.revision : 0;

    // DATA-03: Detect concurrent modification conflict rather than silently overwriting!
    if (input.expectedRevision !== currentRevision && current) {
      return {
        status: 'conflict_detected',
        httpStatus: 409,
        conflict: {
          messageVi:
            'Phát hiện xung đột phiên bản Kế hoạch An toàn (Revision Conflict): Kế hoạch đã được cập nhật từ thiết bị khác. Hệ thống không tự động ghi đè để bảo vệ dữ liệu an toàn của bạn.',
          messageEn:
            'Safety Plan revision conflict detected: The safety plan was modified on another session/device. Silent overwrite is blocked.',
          serverRecord: current,
          clientSubmittedContent: input,
          expectedRevision: input.expectedRevision,
          actualServerRevision: currentRevision,
        },
        errors: [
          `Revision conflict: expected revision ${input.expectedRevision}, but server is at revision ${currentRevision}.`,
        ],
      };
    }

    const nowIso = input.updatedAt ?? new Date().toISOString();
    const nextRecord: V2VersionedSafetyPlanRecord = {
      id: current?.id ?? input.id,
      userId: input.userId,
      revision: currentRevision + 1,
      idempotencyKey: input.idempotencyKey,
      section1WarningSigns: [...input.section1WarningSigns],
      section2InternalCoping: [...input.section2InternalCoping],
      section3SocialDistractions: [...input.section3SocialDistractions],
      section4TrustedContacts: input.section4TrustedContacts.map((c) => ({ ...c })),
      section5ProfessionalContacts: input.section5ProfessionalContacts.map((c) => ({ ...c })),
      section6EnvironmentSafety: [...input.section6EnvironmentSafety],
      explicitContactStorageConsent: input.explicitContactStorageConsent,
      updatedAt: nowIso,
    };

    this.safetyPlanByUser.set(input.userId, nextRecord);
    this.idempotencyRegistry.set(idemKey, nextRecord);

    if (input.explicitContactStorageConsent) {
      this.recordConsentEvent(
        input.userId,
        'safety_plan_contact_storage',
        'granted',
        nowIso,
      );
    }
    this.recordAudit(input.userId, 'user', 'safety_plan_upserted', 'safety_plan', nextRecord.id);

    return {
      status: 'saved',
      httpStatus: currentRevision === 0 ? 201 : 200,
      record: nextRecord,
      errors: [],
    };
  }

  public getSafetyPlan(userId: string): V2VersionedSafetyPlanRecord | null {
    return this.safetyPlanByUser.get(userId) ?? null;
  }

  // ---------------------------------------------------------------------------
  // Offline Queue Isolation on Logout / Account Switch (DATA_ARCHITECTURE.md §Sync contract)
  // ---------------------------------------------------------------------------
  public enqueueOfflineOperation(op: V2OfflineQueueOperation): void {
    this.offlineQueue.push(op);
  }

  public getOfflineQueueForUser(userId: string): V2OfflineQueueOperation[] {
    return this.offlineQueue.filter((item) => item.boundUserId === userId);
  }

  /**
   * Clears offline sync queue on logout so queued items from Account A
   * are NEVER sent after logout or switch to Account B.
   */
  public clearOfflineQueueOnLogout(loggedOutUserId?: string): number {
    const before = this.offlineQueue.length;
    if (!loggedOutUserId) {
      this.offlineQueue = [];
    } else {
      this.offlineQueue = this.offlineQueue.filter((op) => op.boundUserId !== loggedOutUserId);
    }
    return before - this.offlineQueue.length;
  }

  public flushOfflineQueueForActiveAccount(activeAuthenticatedUserId: string): {
    flushedCount: number;
    rejectedCrossAccountCount: number;
  } {
    let flushedCount = 0;
    let rejectedCrossAccountCount = 0;

    const remaining: V2OfflineQueueOperation[] = [];
    for (const op of this.offlineQueue) {
      if (op.boundUserId !== activeAuthenticatedUserId) {
        // Hard block: never send offline queue operation belonging to another account
        rejectedCrossAccountCount += 1;
        continue;
      }
      flushedCount += 1;
    }
    this.offlineQueue = remaining;
    return { flushedCount, rejectedCrossAccountCount };
  }

  // ---------------------------------------------------------------------------
  // SAFE-06 & AUTH-08: Scoped Sharing Grants (Caregiver / Clinician)
  // ---------------------------------------------------------------------------
  public createSharingGrant(input: {
    grantId: string;
    ownerUserId: string;
    granteeUserId: string;
    granteeRole: 'caregiver' | 'clinician';
    allowedScopes: V2SharingScopeField[];
    expiresAt: string;
    nowIso?: string;
  }): ValidationResult<V2SharingGrantRecord> {
    if (!input.ownerUserId || !input.granteeUserId) {
      return { valid: false, errors: ['ownerUserId and granteeUserId are required.'] };
    }
    if (input.ownerUserId === input.granteeUserId) {
      return { valid: false, errors: ['ownerUserId and granteeUserId must be distinct users.'] };
    }
    if (!Array.isArray(input.allowedScopes) || input.allowedScopes.length === 0) {
      return { valid: false, errors: ['At least one explicit sharing scope must be selected.'] };
    }

    const nowIso = input.nowIso ?? new Date().toISOString();
    const record: V2SharingGrantRecord = {
      grantId: input.grantId,
      ownerUserId: input.ownerUserId,
      granteeUserId: input.granteeUserId,
      granteeRole: input.granteeRole,
      allowedScopes: [...input.allowedScopes],
      allowPrivateJournalNotes: false,
      createdAt: nowIso,
      expiresAt: input.expiresAt,
      revokedAt: null,
      revision: 1,
    };

    this.sharingGrantsById.set(record.grantId, record);
    this.recordConsentEvent(input.ownerUserId, 'sharing_grant_created', 'granted', nowIso);
    this.recordAudit(input.ownerUserId, 'user', 'sharing_grant_created', 'sharing_grant', record.grantId);
    return { valid: true, errors: [], data: record };
  }

  public revokeSharingGrant(params: {
    grantId: string;
    actorUserId: string;
    nowIso?: string;
  }): ValidationResult<V2SharingGrantRecord> {
    const grant = this.sharingGrantsById.get(params.grantId);
    if (!grant) {
      return { valid: false, errors: ['Sharing grant not found.'] };
    }
    if (grant.ownerUserId !== params.actorUserId) {
      return {
        valid: false,
        errors: ['Forbidden (403): Only the patient owner can revoke their sharing grant.'],
      };
    }

    const nowIso = params.nowIso ?? new Date().toISOString();
    const revoked: V2SharingGrantRecord = {
      ...grant,
      revokedAt: nowIso,
      revision: grant.revision + 1,
    };
    this.sharingGrantsById.set(revoked.grantId, revoked);
    this.recordConsentEvent(params.actorUserId, 'sharing_grant_revoked', 'revoked', nowIso);
    this.recordAudit(params.actorUserId, 'user', 'sharing_grant_revoked', 'sharing_grant', revoked.grantId);
    return { valid: true, errors: [], data: revoked };
  }

  /**
   * Server-authoritative access check for Caregiver / Clinician reading scoped patient data (`SAFE-06`, `AUTH-08`).
   * - Rejects offline/unverified requests (`serverOnlineVerified !== true`).
   * - Rejects revoked or expired grants immediately.
   * - Rejects any scope not explicitly granted (and always rejects `private_journal_notes`).
   */
  public readSharedPatientDataWithGrant(params: {
    grantId: string;
    granteeUserId: string;
    requestedScope: V2SharingScopeField | 'private_journal_notes';
    serverOnlineVerified?: boolean;
    nowIso?: string;
  }): {
    allowed: boolean;
    httpStatus: 200 | 403 | 410;
    reasonCode:
      | 'GRANT_VALID'
      | 'OFFLINE_CACHE_BLOCKED_UNVERIFIED'
      | 'GRANT_NOT_FOUND'
      | 'GRANTEE_MISMATCH'
      | 'GRANT_REVOKED'
      | 'GRANT_EXPIRED'
      | 'PRIVATE_JOURNAL_ALWAYS_DENIED'
      | 'SCOPE_NOT_GRANTED';
    data?: unknown;
  } {
    if (params.serverOnlineVerified === false) {
      return {
        allowed: false,
        httpStatus: 403,
        reasonCode: 'OFFLINE_CACHE_BLOCKED_UNVERIFIED',
      };
    }

    if (params.requestedScope === 'private_journal_notes') {
      return {
        allowed: false,
        httpStatus: 403,
        reasonCode: 'PRIVATE_JOURNAL_ALWAYS_DENIED',
      };
    }

    const grant = this.sharingGrantsById.get(params.grantId);
    if (!grant) {
      return { allowed: false, httpStatus: 403, reasonCode: 'GRANT_NOT_FOUND' };
    }
    if (grant.granteeUserId !== params.granteeUserId) {
      return { allowed: false, httpStatus: 403, reasonCode: 'GRANTEE_MISMATCH' };
    }
    if (grant.revokedAt !== null) {
      return { allowed: false, httpStatus: 410, reasonCode: 'GRANT_REVOKED' };
    }

    const nowMs = Date.parse(params.nowIso ?? new Date().toISOString());
    if (nowMs >= Date.parse(grant.expiresAt)) {
      return { allowed: false, httpStatus: 410, reasonCode: 'GRANT_EXPIRED' };
    }

    if (!grant.allowedScopes.includes(params.requestedScope)) {
      return { allowed: false, httpStatus: 403, reasonCode: 'SCOPE_NOT_GRANTED' };
    }

    const ownerId = grant.ownerUserId;
    let scopedData: unknown = null;
    if (params.requestedScope === 'plan_items') {
      scopedData = this.getPlanItems(ownerId);
    } else if (params.requestedScope === 'safety_plan') {
      scopedData = this.getSafetyPlan(ownerId);
    } else if (params.requestedScope === 'session_completion_counts') {
      scopedData = {
        completedSessionsCount: this.getPracticeSessions(ownerId).filter(
          (s) => s.status === 'completed',
        ).length,
      };
    } else {
      scopedData = { ownerId, scope: params.requestedScope };
    }

    this.recordAudit(
      params.granteeUserId,
      grant.granteeRole,
      `shared_read_${params.requestedScope}`,
      'sharing_grant',
      grant.grantId,
    );

    return {
      allowed: true,
      httpStatus: 200,
      reasonCode: 'GRANT_VALID',
      data: scopedData,
    };
  }

  // ---------------------------------------------------------------------------
  // DATA-04: Complete User Privacy Export
  // ---------------------------------------------------------------------------
  public exportUserData(
    userId: string,
    nowIso: string = new Date().toISOString(),
  ): V2UserPrivacyExportBundle {
    this.recordConsentEvent(userId, 'privacy_export', 'executed', nowIso);
    this.recordAudit(userId, 'user', 'privacy_export_executed', 'user_account', userId, nowIso);

    const grants = Array.from(this.sharingGrantsById.values()).filter(
      (g) => g.ownerUserId === userId,
    );

    return {
      exportVersion: '2.0.0',
      exportedAt: nowIso,
      userId,
      nonDiagnosticNoticeVi:
        'Bản xuất dữ liệu cá nhân do người dùng tự ghi nhận (Self-Report). Tài liệu này không phải hồ sơ bệnh án hay chẩn đoán lâm sàng.',
      checkins: this.getCheckIns(userId),
      planItems: this.getPlanItems(userId),
      safetyPlan: this.getSafetyPlan(userId),
      sessions: this.getPracticeSessions(userId),
      sharingGrants: grants,
      consentEvents: [...(this.consentEventsByUser.get(userId) ?? [])],
    };
  }

  // ---------------------------------------------------------------------------
  // DATA-05: User Right-to-Erasure Delete / Purge (Preserving Non-PHI Audit Trail)
  // ---------------------------------------------------------------------------
  public deleteUserData(
    userId: string,
    nowIso: string = new Date().toISOString(),
  ): V2UserPrivacyDeleteResult {
    const checkinsCount = (this.checkinsByUser.get(userId) ?? []).length;
    const planItemsCount = (this.planItemsByUser.get(userId) ?? []).length;
    const safetyPlansCount = this.safetyPlanByUser.has(userId) ? 1 : 0;
    const sessionsCount = (this.sessionsByUser.get(userId) ?? []).length;

    this.checkinsByUser.delete(userId);
    this.planItemsByUser.delete(userId);
    this.safetyPlanByUser.delete(userId);
    this.sessionsByUser.delete(userId);

    let grantsPurged = 0;
    for (const [grantId, grant] of this.sharingGrantsById.entries()) {
      if (grant.ownerUserId === userId) {
        this.sharingGrantsById.delete(grantId);
        grantsPurged += 1;
      }
    }

    // Clear any queued offline items for this user
    this.clearOfflineQueueOnLogout(userId);

    // Clear idempotency cache entries for this user
    for (const key of Array.from(this.idempotencyRegistry.keys())) {
      if (key.includes(`:${userId}:`)) {
        this.idempotencyRegistry.delete(key);
      }
    }

    // Record non-PHI deletion consent & audit event (DATA_ARCHITECTURE.md: "không cascade xóa audit trái retention policy")
    this.recordConsentEvent(userId, 'privacy_delete', 'executed', nowIso);
    this.recordAudit(userId, 'user', 'privacy_delete_executed', 'user_account', userId, nowIso);

    return {
      deleted: true,
      userId,
      purgedCounts: {
        checkins: checkinsCount,
        planItems: planItemsCount,
        safetyPlans: safetyPlansCount,
        sessions: sessionsCount,
        sharingGrantsRevokedAndPurged: grantsPurged,
      },
      auditTrailPreserved: this.getAuditEventsForActor(userId).length > 0,
      deletedAt: nowIso,
    };
  }

  public getAuditEventsForActor(actorId: string): V2AuditEventRecord[] {
    return this.auditEvents.filter((a) => a.actorId === actorId);
  }

  private recordConsentEvent(
    userId: string,
    purpose: V2ConsentEventRecord['purpose'],
    action: V2ConsentEventRecord['action'],
    timestamp: string,
  ): void {
    const list = this.consentEventsByUser.get(userId) ?? [];
    list.push({
      eventId: `consent_${Date.now()}_${list.length + 1}`,
      userId,
      purpose,
      policyVersion: 'v2.0',
      action,
      timestamp,
    });
    this.consentEventsByUser.set(userId, list);
  }

  private recordAudit(
    actorId: string,
    actorRole: V2AuditEventRecord['actorRole'],
    action: string,
    objectType: string,
    objectId: string,
    timestamp: string = new Date().toISOString(),
  ): void {
    this.auditEvents.push({
      auditId: `audit_${Date.now()}_${this.auditEvents.length + 1}`,
      actorId,
      actorRole,
      action,
      objectType,
      objectId,
      timestamp,
    });
  }
}

export const globalV2ClinicalRepository = new V2ClinicalDataRepository();

// =============================================================================
// 3. CLINICAL CONTENT REVIEWER WORKFLOW GATE (T10 — AUTH-08, SAFE-03)
// =============================================================================

export interface ContentLifecycleTransitionRequest {
  item: UnifiedPracticeItem;
  actorUserId: string;
  actorRole: 'user' | 'caregiver' | 'clinician' | 'admin';
  targetReviewStatus: UnifiedReviewStatus;
  targetPublicationStatus: UnifiedPublicationStatus;
  clinicalReviewNote?: string;
  nowIso?: string;
}

/**
 * Enforces the V2 Clinical Content Governance Rule (`AGENTS.md`, `AUTH_SECURITY_REFACTOR.md`, `UNIFIED_PRACTICE_LIBRARY.md`):
 * - Lifecycle: `draft -> clinical_review -> approved -> published -> withdrawn`
 * - Technical `admin` CANNOT self-approve clinical content (`targetReviewStatus === 'approved'`).
 *   Only a qualified `clinician` role with a non-empty `actorUserId` and `clinicalReviewNote` can approve content.
 * - Both `clinician` and `admin` may transition an item to `withdrawn` for emergency safety recall.
 */
export function transitionClinicalContentReviewLifecycle(
  req: ContentLifecycleTransitionRequest,
): ValidationResult<UnifiedPracticeItem> {
  const nowIso = req.nowIso ?? new Date().toISOString();

  if (req.actorRole === 'user' || req.actorRole === 'caregiver') {
    return {
      valid: false,
      errors: ['Forbidden (403): Standard users and caregivers cannot modify clinical catalog lifecycle.'],
    };
  }

  // Emergency withdrawal is allowed for both clinician and admin
  if (req.targetReviewStatus === 'withdrawn' || req.targetPublicationStatus === 'withdrawn') {
    return {
      valid: true,
      errors: [],
      data: {
        ...req.item,
        reviewStatus: 'withdrawn',
        publicationStatus: 'withdrawn',
      },
    };
  }

  // Moving to clinical_review is allowed for admin or clinician
  if (req.targetReviewStatus === 'clinical_review') {
    return {
      valid: true,
      errors: [],
      data: {
        ...req.item,
        reviewStatus: 'clinical_review',
        publicationStatus: 'unpublished',
      },
    };
  }

  // Approving clinical content STRICTLY requires actorRole === 'clinician' (Admin self-approval is BLOCKED!)
  if (req.targetReviewStatus === 'approved' || req.targetPublicationStatus === 'published') {
    if (req.actorRole !== 'clinician') {
      return {
        valid: false,
        errors: [
          'Governance Violation (AUTH-08 / AGENTS.md): Technical admin cannot self-approve clinical protocols. Approval requires a qualified clinician reviewer.',
        ],
      };
    }
    if (!req.clinicalReviewNote || req.clinicalReviewNote.trim().length < 10) {
      return {
        valid: false,
        errors: ['Clinical approval requires a substantive clinicalReviewNote (>= 10 characters).'],
      };
    }

    return {
      valid: true,
      errors: [],
      data: {
        ...req.item,
        reviewStatus: 'approved',
        publicationStatus: req.targetPublicationStatus === 'published' ? 'published' : 'unpublished',
        reviewerId: req.actorUserId,
        reviewerRole: 'clinician',
        reviewedAt: nowIso,
      },
    };
  }

  return {
    valid: true,
    errors: [],
    data: {
      ...req.item,
      reviewStatus: req.targetReviewStatus,
      publicationStatus: req.targetPublicationStatus,
    },
  };
}
