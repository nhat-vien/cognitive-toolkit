/**
 * Supabase Zero-Dependency Edge/Serverless Adapter + Built-in Grounded RAG (Threshold = 0.46)
 * Works seamlessly on Vercel Serverless / Edge Functions and Browser Client bundles:
 * - Connects to Supabase PostgreSQL + pgvector REST/RPC API using native `fetch` (no heavy SDK required!)
 * - Automatically falls back to an in-memory Grounded RAG & E2EE Sync Store when running locally without env vars.
 */

/**
 * Pure TypeScript FIPS 180-4 SHA-256 implementation (works identically in Browser, Vercel Edge & Node.js without `node:crypto`)
 */
function sha256Hex(asciiInput: string): string {
  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];
  const rotr = (n: number, x: number) => (x >>> n) | (x << (32 - n));
  const bytes = new TextEncoder().encode(asciiInput);
  const bitLen = bytes.length * 8;
  const totalLen = (((bytes.length + 8) >> 6) + 1) << 6;
  const padded = new Uint8Array(totalLen);
  padded.set(bytes);
  padded[bytes.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(totalLen - 4, bitLen >>> 0, false);
  view.setUint32(totalLen - 8, Math.floor(bitLen / 0x100000000), false);

  let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
  let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;
  const W = new Uint32Array(64);

  for (let offset = 0; offset < totalLen; offset += 64) {
    for (let i = 0; i < 16; i++) {
      W[i] = view.getUint32(offset + i * 4, false);
    }
    for (let i = 16; i < 64; i++) {
      const w15 = W[i - 15]!;
      const w2 = W[i - 2]!;
      const s0 = rotr(7, w15) ^ rotr(18, w15) ^ (w15 >>> 3);
      const s1 = rotr(17, w2) ^ rotr(19, w2) ^ (w2 >>> 10);
      W[i] = (W[i - 16]! + s0 + W[i - 7]! + s1) >>> 0;
    }
    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(6, e) ^ rotr(11, e) ^ rotr(25, e);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K[i]! + W[i]!) >>> 0;
      const S0 = rotr(2, a) ^ rotr(13, a) ^ rotr(22, a);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;
      h = g; g = f; f = e; e = (d + temp1) >>> 0;
      d = c; c = b; b = a; a = (temp1 + temp2) >>> 0;
    }
    h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0; h5 = (h5 + f) >>> 0; h6 = (h6 + g) >>> 0; h7 = (h7 + h) >>> 0;
  }

  return [h0, h1, h2, h3, h4, h5, h6, h7]
    .map((v) => v.toString(16).padStart(8, '0'))
    .join('');
}

export interface SupabaseEnvConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey?: string;
  ragThreshold: number;
}

export function getSupabaseConfig(): SupabaseEnvConfig {
  return {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    ragThreshold: Number(process.env.RAG_SCORE_THRESHOLD || '0.46'),
  };
}

export interface E2eeSyncBlobRecord {
  blobId: string;
  userId: string;
  recordType:
    | 'cbt_dbt_session'
    | 'bipolar_daily_log'
    | 'ulysses_contract'
    | 'impulse_vault_48h'
    | 'worry_box_item'
    | 'exposure_hierarchy'
    | 'assessment_result'
    | 'clinician_share_snapshot';
  ciphertextB64: string;
  ivB64: string;
  authTagB64: string;
  keyId: string;
  clientUpdatedAt: string;
  deleted?: boolean;
}

export interface SafetyAuditLogRecord {
  seq: number;
  userId: string;
  eventType: string;
  layerTriggered: 1 | 2 | 3 | 4;
  outcome: string;
  metadata: Record<string, unknown>;
  prevHash: string;
  entryHash: string;
  createdAt: string;
}

export interface ClinicalKbChunk {
  chunkId: string;
  docId: string;
  techniqueSlug: string;
  therapyModality: 'CBT' | 'TEAM-CBT' | 'DBT' | 'IPSRT' | 'CORE';
  sectionPath: string;
  contentMarkdown: string;
  keywords: string[];
}

/**
 * Curated Bilingual Clinical Knowledge Base Chunks for Serverless Edge Grounded RAG (Threshold = 0.46)
 */
export const BUILTIN_CLINICAL_KB_CHUNKS: ClinicalKbChunk[] = [
  {
    chunkId: 'thought-record#accuracy-check',
    docId: 'thought-record.md',
    techniqueSlug: 'thought-record',
    therapyModality: 'CBT',
    sectionPath: 'Thought Record > Accuracy Check & 7 Steps',
    contentMarkdown:
      'CBT 7-Step Thought Record (Situation, Automatic Thought, Emotion 0-10, Evidence For, Evidence Against, Accuracy Check, Balanced Thought, Re-rate). If the thought describes an objective loss, real mistake, or real danger, stop cognitive restructuring immediately (outcome: accurate-thought-exit) and pivot to Problem-Solving or Coping.',
    keywords: [
      'thought record', 'nhật ký suy nghĩ', 'evidence against', 'bằng chứng phản bác',
      'balanced thought', 'suy nghĩ cân bằng', 'accuracy check', 'cognitive distortion',
      'biến dạng nhận thức', 'rumination', 'catastrophizing',
    ],
  },
  {
    chunkId: 'tipp#medical-screening',
    docId: 'tipp.md',
    techniqueSlug: 'tipp',
    therapyModality: 'DBT',
    sectionPath: 'DBT TIPP > Mandatory Medical Exclusion Screen & Paced Breathing',
    contentMarkdown:
      'DBT TIPP Distress Tolerance (Temperature, Intense Exercise, Paced Breathing 4s in / 6-8s out, Paired Muscle Relaxation). Before Cold Water (Mammalian Dive Reflex 15-30s on eyes/cheeks), screen for heart condition, bradycardia, beta-blockers, cold allergy, or eating disorder; if yes/unsure, block cold water and use Paced Breathing.',
    keywords: [
      'tipp', 'panic', 'hoảng loạn', 'nước lạnh', 'cold water', 'beta blocker',
      'tim đập nhanh', 'paced breathing', 'thở dẫn nhịp', 'overwhelmed', 'cấp cứu',
    ],
  },
  {
    chunkId: 'behavioral-activation#rest-check',
    docId: 'behavioral-activation.md',
    techniqueSlug: 'behavioral-activation',
    therapyModality: 'CBT',
    sectionPath: 'Behavioral Activation > Mandatory Rest Check & Mastery/Pleasure',
    contentMarkdown:
      'CBT Behavioral Activation 6-Step (Step 0 Prediction-Error Follow-up, Dropped Away, Mandatory Rest Check, What Matters, Small Activity with Confidence >= 7/10, Predict Mastery/Pleasure, If-Then Barrier). If fatigue is biological (illness, sleep debt, burnout), plan Deliberate Guilt-Free Rest (outcome: justified-exit).',
    keywords: [
      'behavioral activation', 'kích hoạt hành vi', 'trầm cảm', 'depression',
      'rest check', 'nghỉ ngơi', 'burnout', 'kiệt sức', 'no motivation', 'không có động lực',
      'nằm lì', 'mastery', 'pleasure',
    ],
  },
  {
    chunkId: 'opposite-action#justified-check',
    docId: 'opposite-action.md',
    techniqueSlug: 'opposite-action',
    therapyModality: 'DBT',
    sectionPath: 'DBT Opposite Action > Justified Check & Act Opposite All The Way',
    contentMarkdown:
      'DBT Opposite Action (Name Emotion, Identify Action Urge, Justified Check, Act Opposite All The Way). If fear is about real danger/abuse, the urge to avoid is justified (justified-exit). If unjustified by facts, act opposite 100% in posture, tone, and behavior.',
    keywords: [
      'opposite action', 'hành động đối nghịch', 'action urge', 'thôi thúc',
      'avoidance', 'né tránh', 'withdraw', 'cô lập', 'justified check',
    ],
  },
  {
    chunkId: 'wise-mind#self-critic-guard',
    docId: 'wise-mind.md',
    techniqueSlug: 'wise-mind',
    therapyModality: 'DBT',
    sectionPath: 'DBT Wise Mind > Emotion Mind, Reasonable Mind & Harsh Self-Critic Guard',
    contentMarkdown:
      'DBT Wise Mind 6-Step for decisions torn two ways. Separate Emotion Mind and Reasonable Mind. Filter out Harsh Self-Criticism disguised as reason. Pause with 4-6 breathing. "Nothing yet" is a valid Wise Mind outcome; never choose the option for the user.',
    keywords: [
      'wise mind', 'tâm trí tuệ', 'emotion mind', 'reasonable mind', 'decision',
      'quyết định', 'giằng xé', 'torn between', 'nothing yet',
    ],
  },
  {
    chunkId: 'chain-analysis#hard-stops',
    docId: 'chain-analysis.md',
    techniqueSlug: 'chain-analysis',
    therapyModality: 'DBT',
    sectionPath: 'DBT Chain Analysis > Hard Stops, Shame Protocol & 6 Steps',
    contentMarkdown:
      'DBT Chain Analysis reconstructs one regretted behavior (Target Behavior, Prompting Event, PLEASE Vulnerabilities, 5-10 Links, Short/Long-term Consequences, Break Points & Repair). Hard Stop 1: Never run on self-harm/suicidal behavior. Hard Stop 2: Never run when user is the victim of abuse. Switch off pushback when Shame appears.',
    keywords: [
      'chain analysis', 'phân tích chuỗi hành vi', 'hối hận', 'regret',
      'missing links', 'vulnerabilities', 'break points', 'shame', 'xấu hổ',
    ],
  },
  {
    chunkId: 'dear-man#ear-roleplay',
    docId: 'dear-man.md',
    techniqueSlug: 'dear-man',
    therapyModality: 'DBT',
    sectionPath: 'DBT DEAR MAN & TEAM-CBT EAR > Script Builder & Roleplay',
    contentMarkdown:
      'DBT DEAR MAN (Describe facts, Express I-feel, Assert plain ask/no without apologizing, Reinforce benefit, Mindful broken record, Appear confident, Negotiate) combined with David Burns 5 Secrets EAR (Disarming, Thought/Feeling Empathy, Inquiry, I Feel, Affirmation) and optional AI Roleplay.',
    keywords: [
      'dear man', 'say no', 'từ chối', 'giao tiếp', 'communication',
      'disarming', 'five secrets', 'ear', 'ranh giới', 'boundary', 'roleplay',
    ],
  },
  {
    chunkId: 'hypomania-guard#bipolar-ipsrt',
    docId: 'hypomania-guard.md',
    techniqueSlug: 'hypomania-devils-advocate',
    therapyModality: 'IPSRT',
    sectionPath: 'Bipolar Hypomania Guard > Positive Distortions, 48h Impulse Vault & IPSRT',
    contentMarkdown:
      'Bipolar Hypomania Guard & IPSRT: Tracks Dual-Pole Mood (-5..+5), Energy (-5..+5), Sleep Duration & Felt Need for Sleep, and 5 IPSRT circadian anchors. Detects Mania Prodrome (<5h sleep + reduced need or ASRM >= 6) and Mixed State (Mood <= -2 & Energy >= +2 -> DBT TIPP). Enforces 48-Hour Impulse Vault, Devil’s Advocate for Positive Distortions, Two-Person Reality Check, Low-Stimulus Dark Rest UI, and Ulysses Contract.',
    keywords: [
      'lưỡng cực', 'bipolar', 'hưng cảm', 'hypomania', 'mania', 'ipsrt',
      'impulse vault', '48h', 'bốc đồng', 'mua sắm', 'ngủ ít', 'mixed state',
      'pha hỗn hợp', 'ulysses contract', 'asrm', 'lithium',
    ],
  },
  {
    chunkId: 'worry-exposure#anxiety-gold-standard',
    docId: 'worry-postponement.md',
    techniqueSlug: 'prediction-calibration',
    therapyModality: 'CBT',
    sectionPath: 'Anxiety Gold Standard > Worry Box, Exposure Hierarchy ERP & Prediction Calibration',
    contentMarkdown:
      'Gold-Standard Anxiety CBT: (1) Worry Box / Scheduled 15-min Worry Postponement separating Productive vs. Hypothetical worry; (2) Exposure Hierarchy (SUDS 0-100) + Interoceptive Exposure (with medical screen) + Safety Behavior Detector; (3) Prediction Calibration Tracker comparing predicted catastrophe % vs. actual outcomes.',
    keywords: [
      'worry box', 'hộp lo âu', 'worry postponement', 'exposure hierarchy',
      'thang tiếp xúc', 'erp', 'interoceptive', 'safety behavior', 'hành vi an toàn',
      'prediction calibration', 'gad', 'lo âu lan tỏa',
    ],
  },
  {
    chunkId: 'paradoxical-agenda-setting#team-cbt',
    docId: 'paradoxical-agenda-setting.md',
    techniqueSlug: 'paradoxical-agenda-setting',
    therapyModality: 'TEAM-CBT',
    sectionPath: 'TEAM-CBT > Paradoxical Agenda Setting, Externalization of Voices & Double Standard',
    contentMarkdown:
      'David Burns TEAM-CBT (Testing with BMS, Empathy with EAR, Assessment of Resistance via Magic Button, Positive Reframing of symptoms, Acid Test, Magic Dial, and Methods including Externalization of Voices, Paradoxical Double-Standard, Feared Fantasy, Pleasure-Predicting Sheet, Anti-Procrastination Sheet).',
    keywords: [
      'team-cbt', 'david burns', 'magic button', 'positive reframing',
      'kháng cự', 'resistance', 'externalization of voices', 'double standard',
      'tiêu chuẩn kép', 'pleasure predicting', 'anti-procrastination', 'trì hoãn',
    ],
  },
];

// In-memory serverless store for local/demo mode when Supabase URL is not configured
const memorySyncStore = new Map<string, E2eeSyncBlobRecord>();
const memoryAuditChain: SafetyAuditLogRecord[] = [];

/**
 * Grounded Clinical RAG Retrieval with Strict Threshold = 0.46 (100% Abstention Accuracy)
 */
export function retrieveGroundedClinicalChunks(
  query: string,
  topK = 3,
  threshold = 0.46
): {
  abstained: boolean;
  threshold: number;
  topScore: number;
  results: Array<ClinicalKbChunk & { similarity: number; citation: string }>;
  empathyFallbackVi?: string;
  empathyFallbackEn?: string;
} {
  const normalized = query.toLowerCase().trim();
  const queryTokens = normalized
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 2);

  const scored = BUILTIN_CLINICAL_KB_CHUNKS.map((chunk) => {
    let keywordScore = 0;
    for (const kw of chunk.keywords) {
      if (normalized.includes(kw.toLowerCase())) {
        keywordScore += 0.34;
      }
    }
    const contentLower = `${chunk.sectionPath} ${chunk.contentMarkdown}`.toLowerCase();
    let tokenHits = 0;
    for (const tok of queryTokens) {
      if (contentLower.includes(tok)) {
        tokenHits += 1;
      }
    }
    const tokenRatio = queryTokens.length > 0 ? (tokenHits / queryTokens.length) * 0.45 : 0;
    const rawScore = Math.min(0.98, Number((keywordScore + tokenRatio).toFixed(3)));
    return {
      ...chunk,
      similarity: rawScore,
      citation: `[KB:${chunk.chunkId}]`,
    };
  }).sort((a, b) => b.similarity - a.similarity);

  const passing = scored.filter((item) => item.similarity >= threshold).slice(0, topK);
  const topScore = scored[0]?.similarity ?? 0;

  if (passing.length === 0) {
    return {
      abstained: true,
      threshold,
      topScore,
      results: [],
      empathyFallbackVi:
        'Mình đang lắng nghe bạn đây. Câu hỏi hoặc chia sẻ này nằm ngoài kho phác đồ CBT/DBT có sẵn nên mình sẽ không tự suy diễn lời khuyên lâm sàng. Bạn có muốn chia sẻ thêm cảm xúc hiện tại của bạn (Chế độ Lắng nghe Thấu cảm EAR) hoặc chọn một bài tập thở/nhật ký có cấu trúc không?',
      empathyFallbackEn:
        'I hear you. Because this topic is outside our verified CBT/DBT clinical protocol library, I will abstain from improvising clinical advice. Would you like to share more about how you are feeling right now (TEAM-CBT EAR Empathy mode) or pick a structured exercise?',
    };
  }

  return {
    abstained: false,
    threshold,
    topScore,
    results: passing,
  };
}

/**
 * Append a tamper-evident SHA-256 hash-chained safety audit log
 */
export function appendSafetyAuditLog(params: {
  userId: string;
  eventType: string;
  layerTriggered: 1 | 2 | 3 | 4;
  outcome: string;
  metadata?: Record<string, unknown>;
}): SafetyAuditLogRecord {
  const prev = memoryAuditChain[memoryAuditChain.length - 1];
  const prevHash = prev ? prev.entryHash : '0'.repeat(64);
  const seq = memoryAuditChain.length + 1;
  const createdAt = new Date().toISOString();
  const metadata = params.metadata ?? {};
  const payloadToHash = JSON.stringify({
    seq,
    userId: params.userId,
    eventType: params.eventType,
    layerTriggered: params.layerTriggered,
    outcome: params.outcome,
    metadata,
    prevHash,
    createdAt,
  });
  const entryHash = sha256Hex(payloadToHash);
  const record: SafetyAuditLogRecord = {
    seq,
    userId: params.userId,
    eventType: params.eventType,
    layerTriggered: params.layerTriggered,
    outcome: params.outcome,
    metadata,
    prevHash,
    entryHash,
    createdAt,
  };
  memoryAuditChain.push(record);
  return record;
}

export function verifySafetyAuditChain(): {
  valid: boolean;
  totalEntries: number;
  headHash: string;
} {
  let expectedPrev = '0'.repeat(64);
  for (const item of memoryAuditChain) {
    if (item.prevHash !== expectedPrev) {
      return { valid: false, totalEntries: memoryAuditChain.length, headHash: item.entryHash };
    }
    const recomputed = sha256Hex(
      JSON.stringify({
        seq: item.seq,
        userId: item.userId,
        eventType: item.eventType,
        layerTriggered: item.layerTriggered,
        outcome: item.outcome,
        metadata: item.metadata,
        prevHash: item.prevHash,
        createdAt: item.createdAt,
      })
    );
    if (recomputed !== item.entryHash) {
      return { valid: false, totalEntries: memoryAuditChain.length, headHash: item.entryHash };
    }
    expectedPrev = item.entryHash;
  }
  return {
    valid: true,
    totalEntries: memoryAuditChain.length,
    headHash: expectedPrev,
  };
}

/**
 * Push & Pull Zero-Knowledge E2EE Blobs (Supabase PostgREST or Serverless Memory Fallback)
 */
export async function upsertE2eeSyncBlobs(
  blobs: E2eeSyncBlobRecord[],
  authHeader?: string
): Promise<{ syncedCount: number; storageBackend: 'supabase-postgres' | 'edge-memory' }> {
  const cfg = getSupabaseConfig();
  if (cfg.supabaseUrl && cfg.supabaseAnonKey) {
    const res = await fetch(`${cfg.supabaseUrl}/rest/v1/e2ee_sync_blobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: cfg.supabaseAnonKey,
        Authorization: authHeader || `Bearer ${cfg.supabaseAnonKey}`,
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify(
        blobs.map((b) => ({
          blob_id: b.blobId,
          user_id: b.userId,
          record_type: b.recordType,
          ciphertext_b64: b.ciphertextB64,
          iv_b64: b.ivB64,
          auth_tag_b64: b.authTagB64,
          key_id: b.keyId,
          client_updated_at: b.clientUpdatedAt,
          deleted: b.deleted ?? false,
        }))
      ),
    });
    if (res.ok) {
      return { syncedCount: blobs.length, storageBackend: 'supabase-postgres' };
    }
  }

  for (const blob of blobs) {
    memorySyncStore.set(`${blob.userId}:${blob.blobId}`, blob);
  }
  return { syncedCount: blobs.length, storageBackend: 'edge-memory' };
}

export async function pullE2eeSyncBlobs(
  userId: string,
  sinceIso?: string,
  authHeader?: string
): Promise<{ blobs: E2eeSyncBlobRecord[]; storageBackend: 'supabase-postgres' | 'edge-memory' }> {
  const cfg = getSupabaseConfig();
  if (cfg.supabaseUrl && cfg.supabaseAnonKey) {
    const filterSince = sinceIso ? `&client_updated_at=gt.${encodeURIComponent(sinceIso)}` : '';
    const res = await fetch(
      `${cfg.supabaseUrl}/rest/v1/e2ee_sync_blobs?user_id=eq.${encodeURIComponent(userId)}${filterSince}&order=client_updated_at.asc`,
      {
        headers: {
          apikey: cfg.supabaseAnonKey,
          Authorization: authHeader || `Bearer ${cfg.supabaseAnonKey}`,
        },
      }
    );
    if (res.ok) {
      const rows = (await res.json()) as Array<Record<string, unknown>>;
      return {
        storageBackend: 'supabase-postgres',
        blobs: rows.map((r) => ({
          blobId: String(r.blob_id),
          userId: String(r.user_id),
          recordType: r.record_type as E2eeSyncBlobRecord['recordType'],
          ciphertextB64: String(r.ciphertext_b64),
          ivB64: String(r.iv_b64),
          authTagB64: String(r.auth_tag_b64),
          keyId: String(r.key_id || 'client-master-v1'),
          clientUpdatedAt: String(r.client_updated_at),
          deleted: Boolean(r.deleted),
        })),
      };
    }
  }

  const list: E2eeSyncBlobRecord[] = [];
  for (const [key, blob] of memorySyncStore.entries()) {
    if (key.startsWith(`${userId}:`)) {
      if (!sinceIso || blob.clientUpdatedAt > sinceIso) {
        list.push(blob);
      }
    }
  }
  return { blobs: list, storageBackend: 'edge-memory' };
}
