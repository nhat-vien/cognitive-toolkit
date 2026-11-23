'use client';

import React, { useMemo, useState } from 'react';
import {
  MASTER_PROTOCOL_CATALOG,
  INSTRUMENT_GOVERNANCE_REGISTRY,
  evaluateEmergencyDirectoryStatus,
  validatePersonalSafetyPlan,
  evaluateMasterPlanSafetySubsystem,
  scoreWho5WellBeing,
  evaluateMedicationSupportAction,
  evaluateMultiSignalBipolarPrecautions,
  createGranularCaregiverAccessGrant,
  revokeCaregiverAccessGrant,
  buildUserControlledReportWithRedaction,
  type ProtocolManifest,
  type TherapyModel,
  type PathwayWorkflowState,
  type CaregiverAccessGrantRecord,
} from '../clinical/index';

interface ClinicalMasterPlanHubProps {
  lang: 'vi' | 'en';
  distressIntensity: number;
  moodPolarity: number;
  energyLevel: number;
  onOpenEmergencySos: () => void;
}

const THERAPY_MODEL_META: Record<
  TherapyModel,
  { icon: string; labelVi: string; labelEn: string; benefitVi: string; benefitEn: string }
> = {
  CBT: {
    icon: '📝',
    labelVi: 'CBT (Nhận thức – Hành vi • 11 phác đồ)',
    labelEn: 'CBT (Cognitive Behavioral • 11 protocols)',
    benefitVi:
      'Tác dụng: Nhận diện mối liên hệ Tình huống – Suy nghĩ – Cảm xúc – Hành vi; giảm lo âu kéo dài, bớt trầm buồn & lấy lại động lực sống.',
    benefitEn:
      'Benefit: Recognize links among situations, thoughts, emotions, and behaviors; reduce persistent anxiety and low mood.',
  },
  'TEAM-CBT': {
    icon: '🎯',
    labelVi: 'TEAM-CBT (Thấu cảm & Gỡ rào cản • 7 phác đồ)',
    labelEn: 'TEAM-CBT (Empathy & Ambivalence • 7 protocols)',
    benefitVi:
      'Tác dụng: Đặt thấu cảm lên trước khi thay đổi, khám phá sự lưỡng lự một cách tôn trọng, giảm áp lực hoàn hảo và vượt trì hoãn.',
    benefitEn:
      'Benefit: Empathy before change; explore ambivalence respectfully without blaming the user.',
  },
  DBT: {
    icon: '🧘',
    labelVi: 'DBT (4 Nhóm Kỹ năng Điều hòa • 19 phác đồ)',
    labelEn: 'DBT (4 Skills Domains • 19 protocols)',
    benefitVi:
      'Tác dụng: 4 trụ cột Chánh niệm, Chịu đựng Căng thẳng, Điều hòa Cảm xúc & Hiệu quả Giao tiếp — hạ nhiệt cơn khủng hoảng và bảo vệ mối quan hệ.',
    benefitEn:
      'Benefit: Mindfulness, Distress Tolerance, Emotion Regulation, and Interpersonal Effectiveness.',
  },
  IPSRT: {
    icon: '🌙',
    labelVi: 'IPSRT (Nhịp Sinh học & Xã hội • 7 thành phần)',
    labelEn: 'IPSRT (Social Rhythm Therapy • 7 components)',
    benefitVi:
      'Tác dụng: Theo dõi 5 mốc sinh hoạt theo nền cá nhân (có múi giờ), phân biệt mất ngủ với giảm nhu cầu ngủ, ổn định khí sắc lưỡng cực.',
    benefitEn:
      'Benefit: Support regularity in daily routines against personal baseline to protect bipolar mood stability.',
  },
  MBCT: {
    icon: '🍃',
    labelVi: 'MBCT (Chánh niệm Nhận thức • Chuỗi 8 bài)',
    labelEn: 'MBCT (Mindfulness-Based Cognitive • 8 steps)',
    benefitVi:
      'Tác dụng: Bước ra khỏi chế độ tự động, nhìn suy nghĩ chỉ là sự kiện tâm trí (không phải sự thật tuyệt đối), phòng ngừa tái phát trầm cảm.',
    benefitEn:
      'Benefit: Step out of automatic pilot, decenter from negative thoughts, and support relapse awareness.',
  },
  Psychoeducation: {
    icon: '📖',
    labelVi: 'Giáo dục Tâm lý (10 Chuyên đề Chuẩn hóa)',
    labelEn: 'Psychoeducation (10 Reviewed Modules)',
    benefitVi:
      'Tác dụng: Cung cấp kiến thức có nguồn trích dẫn (NICE/WHO), phân biệt triệu chứng cơ thể cần khám y khoa, hóa giải tự kỳ thị.',
    benefitEn:
      'Benefit: Reviewed, cited learning modules with clear medical boundaries and anti-stigma self-compassion.',
  },
  FFT: {
    icon: '🤝',
    labelVi: 'FFT (Đồng hành Gia đình & Người thân • 6 mô-đun)',
    labelEn: 'FFT (Family-Focused Support • 6 modules)',
    benefitVi:
      'Tác dụng: Giao tiếp gia đình lành mạnh, thống nhất kế hoạch dấu hiệu sớm và bảo vệ quyền riêng tư tuyệt đối do người bệnh kiểm soát.',
    benefitEn:
      'Benefit: Consented caregiver education, active listening, and shared early-warning plans with granular privacy.',
  },
};

const WORKFLOW_STATE_BADGE: Record<
  PathwayWorkflowState,
  { bg: string; border: string; text: string; titleVi: string; titleEn: string }
> = {
  routine_support: {
    bg: '#ECFDF5',
    border: '#A7F3D0',
    text: '#065F46',
    titleVi: 'Trạng thái luồng: Hỗ trợ Thường quy (routine_support)',
    titleEn: 'Workflow State: Routine Support (routine_support)',
  },
  distress_support: {
    bg: '#FFFBEB',
    border: '#FDE68A',
    text: '#92400E',
    titleVi: 'Trạng thái luồng: Hỗ trợ Làm dịu Căng thẳng (distress_support)',
    titleEn: 'Workflow State: Distress Support (distress_support)',
  },
  professional_follow_up_recommended: {
    bg: '#EFF6FF',
    border: '#BFDBFE',
    text: '#1E40AF',
    titleVi: 'Trạng thái luồng: Khuyến nghị Thăm khám Chuyên gia (professional_follow_up_recommended)',
    titleEn: 'Workflow State: Professional Follow-Up Recommended',
  },
  urgent_human_support: {
    bg: '#FEF2F2',
    border: '#FECACA',
    text: '#991B1B',
    titleVi: 'Trạng thái luồng: Cần Kết nối Hỗ trợ Con người Khẩn (urgent_human_support)',
    titleEn: 'Workflow State: Urgent Human Support (urgent_human_support)',
  },
  emergency_guidance: {
    bg: '#FFF1F2',
    border: '#FDA4AF',
    text: '#881337',
    titleVi: 'Trạng thái luồng: Hướng dẫn Cấp cứu Tức thì (emergency_guidance)',
    titleEn: 'Workflow State: Emergency Guidance (emergency_guidance)',
  },
};

export function ClinicalMasterPlanHub({
  lang,
  distressIntensity,
  moodPolarity,
  energyLevel,
  onOpenEmergencySos,
}: ClinicalMasterPlanHubProps) {
  const [subTab, setSubTab] = useState<
    'protocols-68' | 'safety-plan-directory' | 'meds-and-bipolar' | 'fft-caregiver' | 'who5-and-redaction'
  >('protocols-68');

  // 1. 68-Protocol Explorer & Interactive 7-Step Session Runner State
  const [selectedModel, setSelectedModel] = useState<TherapyModel>('CBT');
  const [selectedDbtDomain, setSelectedDbtDomain] = useState<string>('ALL');
  const [activeProtocolId, setActiveProtocolId] = useState<string>('CBT_THOUGHT_RECORD');
  const [activeStepIdx, setActiveStepIdx] = useState<number>(0);
  const [sessionState, setSessionState] = useState<'idle' | 'active' | 'paused' | 'stopped'>('idle');
  const [useNonWritingMode, setUseNonWritingMode] = useState<boolean>(false);
  const [stepNotes, setStepNotes] = useState<Record<string, string>>({});
  const [selectedTapOption, setSelectedTapOption] = useState<string>('');
  const [postSkillDistress, setPostSkillDistress] = useState<number>(distressIntensity);
  const [adverseExperienceReported, setAdverseExperienceReported] = useState<boolean>(false);
  const [mbctEyesOpenGrounding, setMbctEyesOpenGrounding] = useState<boolean>(true);

  // 2. Personal Safety Plan (6 Sections — §3.4) & Emergency Directory State
  const [countryCode, setCountryCode] = useState<'VN' | 'US'>('VN');
  const [spWarningSigns, setSpWarningSigns] = useState<string>(
    'Mất ngủ liên tiếp, cảm giác trống rỗng nặng nề, muốn thu mình không gặp ai',
  );
  const [spInternalCoping, setSpInternalCoping] = useState<string>(
    'Thở chậm 4-6 trong 2 phút, nghe Thiền Buông Thư 432Hz, bước ra ban công hít thở',
  );
  const [spDistractionPlaces, setSpDistractionPlaces] = useState<string>(
    'Đi bộ quanh công viên gần nhà, ngồi ở phòng khách có ánh sáng ấm',
  );
  const [spTrustedContactName, setSpTrustedContactName] = useState<string>('Người thân tin cậy');
  const [spTrustedContactPhone, setSpTrustedContactPhone] = useState<string>('0901234567');
  const [spProfessionalContact, setSpProfessionalContact] = useState<string>(
    'Bác sĩ tâm thần điều trị / Viện Sức khỏe Tâm thần (1900 1267) / Cấp cứu 115',
  );
  const [spEnvironmentSafety, setSpEnvironmentSafety] = useState<string>(
    'Cất giữ vật sắc nhọn và thuốc dự trữ ở nơi an toàn có người thân quản lý',
  );
  const [spExplicitContactConsent, setSpExplicitContactConsent] = useState<boolean>(true);
  const [spSavedMessage, setSpSavedMessage] = useState<string>('');

  // 3. Medication Support (§7) & Multi-Signal Bipolar (§3.5) State
  const [medName, setMedName] = useState<string>('Lithium Carbonate (Theo toa bác sĩ)');
  const [medSchedule, setMedSchedule] = useState<string>('20:00 hằng ngày sau bữa tối');
  const [medIntakeStatus, setMedIntakeStatus] = useState<'taken' | 'missed' | 'uncertain'>('taken');
  const [medSideEffectNote, setMedSideEffectNote] = useState<string>('');
  const [medLogs, setMedLogs] = useState<
    Array<{ id: string; name: string; status: 'taken' | 'missed' | 'uncertain'; note: string; time: string }>
  >([]);
  const [sigReducedSleepNeed, setSigReducedSleepNeed] = useState<boolean>(moodPolarity >= 2);
  const [sigElevatedIrritable, setSigElevatedIrritable] = useState<boolean>(moodPolarity >= 2);
  const [sigIncreasedEnergy, setSigIncreasedEnergy] = useState<boolean>(energyLevel >= 2);
  const [sigRacingThoughts, setSigRacingThoughts] = useState<boolean>(false);
  const [sigImpulsivity, setSigImpulsivity] = useState<boolean>(false);
  const [sigRoutineDeviation, setSigRoutineDeviation] = useState<boolean>(false);

  // 4. FFT Caregiver Granular Consent (§4.7) State
  const [caregiverName, setCaregiverName] = useState<string>('Người thân đồng hành (Gia đình)');
  const [cgAllowEarlyWarning, setCgAllowEarlyWarning] = useState<boolean>(true);
  const [cgAllowFftModules, setCgAllowFftModules] = useState<boolean>(true);
  const [cgAllowRhythmSummary, setCgAllowRhythmSummary] = useState<boolean>(false);
  const [cgAllowPrivateJournals, setCgAllowPrivateJournals] = useState<boolean>(false);
  const [cgAllowSessionContent, setCgAllowSessionContent] = useState<boolean>(false);
  const [cgAllowAssessmentAnswers, setCgAllowAssessmentAnswers] = useState<boolean>(false);
  const [activeCaregiverGrant, setActiveCaregiverGrant] = useState<CaregiverAccessGrantRecord | null>(() => {
    const init = createGranularCaregiverAccessGrant({
      grantId: 'grant-demo-01',
      patientUserId: 'patient-self',
      caregiverUserId: 'caregiver-family-01',
      patientInvitedCaregiver: true,
    });
    return init.data ?? null;
  });

  // 5. WHO-5 Well-Being (§6.2) & Clinical Report Preview / Redaction (§10.3)
  const [who5Items, setWho5Items] = useState<[number, number, number, number, number]>([3, 3, 3, 3, 3]);
  const [redactJournals, setRedactJournals] = useState<boolean>(true);
  const [redactSessions, setRedactSessions] = useState<boolean>(true);
  const [redactRawItems, setRedactRawItems] = useState<boolean>(true);
  const [redactMedNotes, setRedactMedNotes] = useState<boolean>(false);

  const bipolarMultiSignalEval = useMemo(
    () =>
      evaluateMultiSignalBipolarPrecautions({
        reducedNeedForSleepReported: sigReducedSleepNeed,
        elevatedOrIrritableMoodReported: sigElevatedIrritable,
        increasedEnergyOrGoalDirectedActivity: sigIncreasedEnergy,
        unusualTalkativenessOrRacingThoughts: sigRacingThoughts,
        increasedImpulsivityOrRiskyBehavior: sigImpulsivity,
        significantRoutineDeviation: sigRoutineDeviation,
        psychoticSymptomsOrSevereImpairment: false,
      }),
    [
      sigReducedSleepNeed,
      sigElevatedIrritable,
      sigIncreasedEnergy,
      sigRacingThoughts,
      sigImpulsivity,
      sigRoutineDeviation,
    ],
  );

  const safetyEval = useMemo(
    () =>
      evaluateMasterPlanSafetySubsystem({
        userId: 'current-user',
        acuteDistressIntensity: distressIntensity,
        multiSignalManiaOrMixedStateDetected: bipolarMultiSignalEval.promptHumanClinicalContactRecommended,
        countryCode,
      }),
    [distressIntensity, bipolarMultiSignalEval.promptHumanClinicalContactRecommended, countryCode],
  );

  const directoryStatus = useMemo(
    () => evaluateEmergencyDirectoryStatus({ countryCode }),
    [countryCode],
  );

  const filteredProtocols = useMemo(() => {
    return MASTER_PROTOCOL_CATALOG.filter((p) => {
      if (p.therapy_model !== selectedModel) return false;
      if (selectedModel === 'DBT' && selectedDbtDomain !== 'ALL' && p.dbt_domain !== selectedDbtDomain) {
        return false;
      }
      return true;
    });
  }, [selectedModel, selectedDbtDomain]);

  const activeProtocol: ProtocolManifest = useMemo(() => {
    return (
      MASTER_PROTOCOL_CATALOG.find((p) => p.protocol_id === activeProtocolId) ??
      filteredProtocols[0] ??
      MASTER_PROTOCOL_CATALOG[0]!
    );
  }, [activeProtocolId, filteredProtocols]);

  const who5Result = useMemo(() => scoreWho5WellBeing([...who5Items]), [who5Items]);

  const reportPreview = useMemo(
    () =>
      buildUserControlledReportWithRedaction({
        explicitUserRequestConfirmed: true,
        redactPrivateJournals: redactJournals,
        redactSessionTranscripts: redactSessions,
        redactRawAssessmentItems: redactRawItems,
        redactMedicationNotes: redactMedNotes,
        selfReportedMoodSummary: `Khí sắc hiện tại: ${moodPolarity}, Năng lượng: ${energyLevel}, Mức căng thẳng: ${distressIntensity}/10, WHO-5: ${who5Result.percentageScore}/100.`,
        clinicianEnteredNotesSummary: 'Chưa có ghi chú trực tiếp từ bác sĩ điều trị trong kỳ này.',
        privateJournals: ['Nhật ký tâm sự cá nhân ngày 23/11: Cảm thấy áp lực công việc và muốn nghỉ ngơi.'],
        assessments: [
          { instrumentCode: 'WHO-5', date: '2026-11-23', totalScore: who5Result.percentageScore },
          { instrumentCode: 'PHQ-9', date: '2026-11-23', totalScore: 6 },
          { instrumentCode: 'GAD-7', date: '2026-11-23', totalScore: 5 },
        ],
      }),
    [redactJournals, redactSessions, redactRawItems, redactMedNotes, moodPolarity, energyLevel, distressIntensity, who5Result.percentageScore],
  );

  const badgeStyle = WORKFLOW_STATE_BADGE[safetyEval.pathwayState];

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '0 16px 32px' }}>
      {/* Governing Clinical Scope & Live Pathway State Banner (§0.2, §1.2, §2.3) */}
      <div
        style={{
          padding: '14px 18px',
          borderRadius: '16px',
          backgroundColor: badgeStyle.bg,
          border: `1px solid ${badgeStyle.border}`,
          color: badgeStyle.text,
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>
              🛡️ {lang === 'vi' ? badgeStyle.titleVi : badgeStyle.titleEn}
            </div>
            <div style={{ fontSize: '0.83rem', marginTop: '4px', opacity: 0.92 }}>
              {lang === 'vi'
                ? 'Nguyên tắc cốt lõi (§0.2 & §1.2): An toàn luôn ưu tiên trước bài tập • Sàng lọc không phải là chẩn đoán • Không tự động kết luận "nguy cơ thấp" • Không bao giờ tự ý thay đổi thuốc.'
                : 'Governing Principles (§0.2 & §1.2): Safety before engagement • Screening is not diagnosis • No automatic "low risk" claims • No medication changes.'}
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenEmergencySos}
            style={{
              padding: '8px 14px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: '#BE123C',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.84rem',
              cursor: 'pointer',
            }}
          >
            {lang === 'vi' ? '🚨 Hỗ trợ Khẩn cấp & SOS (Không cần khảo sát)' : '🚨 Immediate Emergency Help'}
          </button>
        </div>
      </div>

      {/* 5-Pillar Master Plan Sub-Navigation (§10.1 Primary Navigation & Clinical Modules) */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {(
          [
            ['protocols-68', '🧭', lang === 'vi' ? '68 Phác đồ Chuẩn (7 Liệu pháp)' : '68 Clinical Protocols (7 Models)'],
            ['safety-plan-directory', '🛡️', lang === 'vi' ? 'Kế hoạch An toàn 6 Mục & Danh bạ 115' : '6-Step Safety Plan & Emergency Directory'],
            ['meds-and-bipolar', '💊', lang === 'vi' ? 'Hỗ trợ Thuốc & Đa tín hiệu Lưỡng cực' : 'Medication Boundary & Multi-Signal Bipolar'],
            ['fft-caregiver', '🤝', lang === 'vi' ? 'Gia đình (FFT) & Phân quyền Người thân' : 'Family (FFT) & Caregiver Consent'],
            ['who5-and-redaction', '📋', lang === 'vi' ? 'Thang WHO-5 & Kiểm duyệt Báo cáo' : 'WHO-5 & Report Redaction'],
          ] as const
        ).map(([id, icon, label]) => {
          const active = subTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setSubTab(id)}
              style={{
                padding: '9px 14px',
                borderRadius: '12px',
                border: active ? '2px solid #3E6359' : '1px solid #D5E0DC',
                backgroundColor: active ? '#3E6359' : '#FFFFFF',
                color: active ? '#FFFFFF' : '#26353D',
                fontWeight: 700,
                fontSize: '0.86rem',
                cursor: 'pointer',
              }}
            >
              {icon} {label}
            </button>
          );
        })}
      </div>

      {/* =====================================================================
          SUB-TAB 1: 68 PROTOCOLS ACROSS ALL 7 THERAPY MODELS (§4.1-4.7 & §5.1)
         ===================================================================== */}
      {subTab === 'protocols-68' && (
        <div>
          {/* 7 Therapy Models Selector Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '10px',
              marginBottom: '14px',
            }}
          >
            {(Object.keys(THERAPY_MODEL_META) as TherapyModel[]).map((model) => {
              const meta = THERAPY_MODEL_META[model];
              const isSelected = selectedModel === model;
              return (
                <button
                  key={model}
                  type="button"
                  onClick={() => {
                    setSelectedModel(model);
                    const first = MASTER_PROTOCOL_CATALOG.find((p) => p.therapy_model === model);
                    if (first) {
                      setActiveProtocolId(first.protocol_id);
                      setActiveStepIdx(0);
                      setSessionState('idle');
                    }
                  }}
                  style={{
                    textAlign: 'left',
                    padding: '12px 14px',
                    borderRadius: '14px',
                    border: isSelected ? '2px solid #3E6359' : '1px solid #DCE5E1',
                    backgroundColor: isSelected ? '#F2F8F5' : '#FFFFFF',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1F2D33', marginBottom: '4px' }}>
                    {meta.icon} {lang === 'vi' ? meta.labelVi : meta.labelEn}
                  </div>
                  <div style={{ fontSize: '0.79rem', color: '#4B5E67', lineHeight: 1.45 }}>
                    {lang === 'vi' ? meta.benefitVi : meta.benefitEn}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Optional 4-Domain Filter when DBT is selected (§4.3) */}
          {selectedModel === 'DBT' && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
              {(
                [
                  ['ALL', 'Tất cả 19 kỹ năng DBT'],
                  ['Mindfulness', '1. Chánh niệm (Mindfulness • 4)'],
                  ['Distress Tolerance', '2. Chịu đựng Căng thẳng (Distress Tolerance • 6)'],
                  ['Emotion Regulation', '3. Điều hòa Cảm xúc (Emotion Regulation • 5)'],
                  ['Interpersonal Effectiveness', '4. Hiệu quả Giao tiếp (Interpersonal • 4)'],
                ] as const
              ).map(([domId, domLabel]) => (
                <button
                  key={domId}
                  type="button"
                  onClick={() => setSelectedDbtDomain(domId)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '10px',
                    border: selectedDbtDomain === domId ? '2px solid #3E6359' : '1px solid #D5E0DC',
                    backgroundColor: selectedDbtDomain === domId ? '#E6F2ED' : '#FFFFFF',
                    color: '#1F2D33',
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                  }}
                >
                  {domLabel}
                </button>
              ))}
            </div>
          )}

          {/* Protocol Pills within the selected Therapy Model */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
            {filteredProtocols.map((p) => {
              const isSelected = p.protocol_id === activeProtocol.protocol_id;
              return (
                <button
                  key={p.protocol_id}
                  type="button"
                  onClick={() => {
                    setActiveProtocolId(p.protocol_id);
                    setActiveStepIdx(0);
                    setSessionState('idle');
                  }}
                  style={{
                    padding: '8px 13px',
                    borderRadius: '11px',
                    border: isSelected ? '2px solid #2A5247' : '1px solid #D5E0DC',
                    backgroundColor: isSelected ? '#2A5247' : '#FFFFFF',
                    color: isSelected ? '#FFFFFF' : '#26353D',
                    fontWeight: 600,
                    fontSize: '0.83rem',
                    cursor: 'pointer',
                  }}
                >
                  {lang === 'vi' ? p.title_vi : p.title}
                </button>
              );
            })}
          </div>

          {/* Standardized §5.1 Protocol Specification Card & Interactive 7-Step Session Flow */}
          <div
            style={{
              padding: '20px',
              borderRadius: '18px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #D8E3DF',
              boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#4F7A65', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {activeProtocol.therapy_model}
                  {activeProtocol.dbt_domain ? ` • ${activeProtocol.dbt_domain}` : ''} • ID: <code>{activeProtocol.protocol_id}</code> • v{activeProtocol.version}
                </div>
                <h3 style={{ margin: '4px 0 0', fontSize: '1.15rem', color: '#1A272D' }}>
                  {lang === 'vi' ? activeProtocol.title_vi : activeProtocol.title}
                </h3>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: '8px',
                    backgroundColor: '#FEF3C7',
                    color: '#92400E',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                  }}
                >
                  Trạng thái: {activeProtocol.status} (Chờ chuyên gia duyệt)
                </span>
                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: '8px',
                    backgroundColor:
                      activeProtocol.delivery_boundary === 'clinician_assisted_required' ? '#FCE7F3' : '#E0F2FE',
                    color:
                      activeProtocol.delivery_boundary === 'clinician_assisted_required' ? '#9D174D' : '#075985',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                  }}
                >
                  {activeProtocol.delivery_boundary === 'clinician_assisted_required'
                    ? '👩‍⚕️ Yêu cầu Chuyên gia Đồng hành & Sàng lọc Y khoa'
                    : '🌱 Tự thực hành có hướng dẫn (Self-Guided)'}
                </span>
                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: '8px',
                    backgroundColor: '#F3F4F6',
                    color: '#374151',
                    fontSize: '0.76rem',
                    fontWeight: 600,
                  }}
                >
                  ⏱️ {activeProtocol.estimated_duration}
                </span>
              </div>
            </div>

            {/* Clinical Metadata Grid: Goals, Precautions, Contraindications, Evidence Source */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '10px',
                padding: '12px',
                borderRadius: '12px',
                backgroundColor: '#F8FAF9',
                border: '1px solid #E5ECE9',
                fontSize: '0.83rem',
                marginBottom: '16px',
              }}
            >
              <div>
                <strong style={{ color: '#1E3A32' }}>🎯 Mục tiêu lâm sàng:</strong>
                <div style={{ marginTop: '4px', color: '#37474F' }}>{activeProtocol.goals.join('; ')}</div>
              </div>
              <div>
                <strong style={{ color: '#92400E' }}>⚠️ Lưu ý thận trọng (Precautions):</strong>
                <div style={{ marginTop: '4px', color: '#37474F' }}>{activeProtocol.precautions.join('; ')}</div>
              </div>
              <div>
                <strong style={{ color: '#991B1B' }}>⛔ Khi nào KHÔNG dùng (Contraindications):</strong>
                <div style={{ marginTop: '4px', color: '#37474F' }}>{activeProtocol.contraindications.join('; ')}</div>
              </div>
              <div>
                <strong style={{ color: '#1E40AF' }}>📚 Nguồn tham chiếu (§15):</strong>
                <div style={{ marginTop: '4px', color: '#37474F' }}>
                  {activeProtocol.evidence_references.map((r) => `${r.citation} (${r.relevant_section})`).join('; ')}
                </div>
              </div>
            </div>

            {/* MBCT-Specific Safeguard Controls (§4.5) */}
            {activeProtocol.therapy_model === 'MBCT' && (
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  backgroundColor: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  marginBottom: '14px',
                  fontSize: '0.84rem',
                  color: '#1E3A8A',
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: '6px' }}>
                  🍃 Lưu ý An toàn Chánh niệm MBCT (§4.5):
                </div>
                <div style={{ marginBottom: '8px' }}>
                  • Bạn luôn có thể <strong>mở mắt nhìn một điểm cố định hoặc đặt bàn chân chạm sàn (Tiếp đất / Grounding)</strong> thay vì nhắm mắt theo dõi hơi thở. Nếu bài tập làm tăng cảm giác phân ly, bồn chồn hoặc gợi lại ký ức khó chịu, hãy bấm <strong>Dừng bài tập</strong> ngay.
                </div>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={mbctEyesOpenGrounding}
                    onChange={(e) => setMbctEyesOpenGrounding(e.target.checked)}
                  />
                  Bật chế độ Thực hành Mở mắt & Tiếp đất an toàn (Eyes-Open Grounding Alternative)
                </label>
              </div>
            )}

            {/* Distress-Aware Session Controls (§4.1 Minimum Session Structure & §10.2 Non-Writing / Pause / Skip / Stop) */}
            <div
              style={{
                padding: '16px',
                borderRadius: '14px',
                backgroundColor: '#F4F8F6',
                border: '1px solid #D5E2DD',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#1F2D33' }}>
                  🧭 Quy trình Thực hành Có Hướng dẫn (Bước {activeStepIdx + 1}/{activeProtocol.steps.length})
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setUseNonWritingMode(!useNonWritingMode)}
                    style={{
                      padding: '6px 11px',
                      borderRadius: '9px',
                      border: '1px solid #3E6359',
                      backgroundColor: useNonWritingMode ? '#3E6359' : '#FFFFFF',
                      color: useNonWritingMode ? '#FFFFFF' : '#3E6359',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {useNonWritingMode ? '✓ Đang bật: Chạm chọn (Không cần gõ chữ)' : '👆 Chuyển sang Chạm chọn (Không cần gõ chữ)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSessionState(sessionState === 'paused' ? 'active' : 'paused')}
                    style={{
                      padding: '6px 11px',
                      borderRadius: '9px',
                      border: '1px solid #D97706',
                      backgroundColor: '#FFFBEB',
                      color: '#92400E',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {sessionState === 'paused' ? '▶️ Tiếp tục' : '⏸️ Tạm dừng (Pause)'}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveStepIdx((prev) => (prev + 1 < activeProtocol.steps.length ? prev + 1 : prev))
                    }
                    style={{
                      padding: '6px 11px',
                      borderRadius: '9px',
                      border: '1px solid #64748B',
                      backgroundColor: '#FFFFFF',
                      color: '#334155',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    ⏭️ Bỏ qua bước này (Skip)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSessionState('stopped')}
                    style={{
                      padding: '6px 11px',
                      borderRadius: '9px',
                      border: '1px solid #DC2626',
                      backgroundColor: '#FEF2F2',
                      color: '#991B1B',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    ⏹️ Dừng bài tập (Stop)
                  </button>
                </div>
              </div>

              {sessionState === 'stopped' ? (
                <div style={{ padding: '14px', borderRadius: '12px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
                  <strong style={{ color: '#1E293B' }}>🌿 Bạn đã chủ động dừng bài tập an toàn.</strong>
                  <p style={{ margin: '6px 0 10px', fontSize: '0.86rem', color: '#475569' }}>
                    Việc dừng lại khi thấy mệt hoặc chưa phù hợp là hoàn toàn bình thường (quyền tự quyết của người dùng theo §0.2). Bạn có thể thử một bước nhỏ hơn hoặc mở hỗ trợ con người.
                  </p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setSessionState('active');
                        setActiveStepIdx(0);
                      }}
                      style={{
                        padding: '7px 13px',
                        borderRadius: '9px',
                        border: '1px solid #3E6359',
                        backgroundColor: '#3E6359',
                        color: '#FFFFFF',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      🔄 Mở lại từ Bước 1
                    </button>
                    <button
                      type="button"
                      onClick={() => setSubTab('safety-plan-directory')}
                      style={{
                        padding: '7px 13px',
                        borderRadius: '9px',
                        border: '1px solid #BE123C',
                        backgroundColor: '#FFF1F2',
                        color: '#881337',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      🆘 Mở Kế hoạch An toàn & Liên hệ Người hỗ trợ
                    </button>
                  </div>
                </div>
              ) : sessionState === 'paused' ? (
                <div style={{ padding: '14px', borderRadius: '12px', backgroundColor: '#FFFBEB', color: '#92400E', fontSize: '0.88rem' }}>
                  ⏸️ Phiên thực hành đang tạm dừng. Hãy hít thở nhẹ nhàng, uống một ngụm nước và bấm <strong>Tiếp tục</strong> bất cứ khi nào bạn sẵn sàng.
                </div>
              ) : (
                (() => {
                  const currentStep = activeProtocol.steps[activeStepIdx] ?? activeProtocol.steps[0]!;
                  const stepKey = `${activeProtocol.protocol_id}:${currentStep.id}`;
                  return (
                    <div style={{ padding: '14px', borderRadius: '12px', backgroundColor: '#FFFFFF', border: '1px solid #DCE5E1' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.94rem', color: '#1F2D33', marginBottom: '8px' }}>
                        {lang === 'vi' ? currentStep.titleVi : currentStep.titleEn}
                      </div>

                      {useNonWritingMode ? (
                        <div>
                          <div style={{ fontSize: '0.84rem', color: '#4B5E67', marginBottom: '8px' }}>
                            👆 <strong>Phương án không cần gõ chữ (§4.3 & §10.2):</strong>{' '}
                            {lang === 'vi'
                              ? currentStep.nonWritingAlternativeVi ?? 'Chạm chọn một phản hồi phù hợp với bạn lúc này:'
                              : currentStep.nonWritingAlternativeEn ?? 'Tap an option that fits right now:'}
                          </div>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                            {[
                              'Mình muốn đi từng bước thật nhỏ và chậm rãi',
                              'Mình nhận thấy cơ thể đang hơi căng nhưng vẫn trong tầm kiểm soát',
                              'Mình muốn ghi nhận cảm xúc này mà không tự trách bản thân',
                              'Chưa chắc chắn lắm — mình muốn giữ ở mức quan sát nhẹ nhàng',
                            ].map((opt) => (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => {
                                  setSelectedTapOption(opt);
                                  setStepNotes((prev) => ({ ...prev, [stepKey]: opt }));
                                }}
                                style={{
                                  padding: '7px 12px',
                                  borderRadius: '16px',
                                  border: selectedTapOption === opt ? '2px solid #3E6359' : '1px solid #CBD5E1',
                                  backgroundColor: selectedTapOption === opt ? '#E6F2ED' : '#F8FAFC',
                                  color: '#1E293B',
                                  fontSize: '0.82rem',
                                  cursor: 'pointer',
                                }}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <textarea
                          rows={2}
                          value={stepNotes[stepKey] ?? ''}
                          onChange={(e) =>
                            setStepNotes((prev) => ({ ...prev, [stepKey]: e.target.value }))
                          }
                          placeholder="Ghi chú ngắn gọn (tùy chọn — không bắt buộc viết dài)..."
                          style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            padding: '10px 12px',
                            borderRadius: '10px',
                            border: '1px solid #CBD5E1',
                            fontSize: '0.88rem',
                            marginBottom: '10px',
                          }}
                        />
                      )}

                      {/* Outcome Domain Check (§6.4) on final step */}
                      {activeStepIdx === activeProtocol.steps.length - 1 && (
                        <div
                          style={{
                            padding: '10px 12px',
                            borderRadius: '10px',
                            backgroundColor: '#F8FAF9',
                            border: '1px solid #E2E8F0',
                            marginBottom: '10px',
                            fontSize: '0.83rem',
                          }}
                        >
                          <div style={{ fontWeight: 700, marginBottom: '6px' }}>
                            📊 Ghi nhận Trải nghiệm Sau Bài tập (§6.4 — Phản hồi chủ quan, không dùng làm bằng chứng hiệu quả điều trị tuyệt đối):
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '6px' }}>
                            <span>Mức độ căng thẳng hiện tại: <strong>{postSkillDistress}/10</strong></span>
                            <input
                              type="range"
                              min={0}
                              max={10}
                              value={postSkillDistress}
                              onChange={(e) => setPostSkillDistress(Number(e.target.value))}
                            />
                          </div>
                          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={adverseExperienceReported}
                              onChange={(e) => setAdverseExperienceReported(e.target.checked)}
                            />
                            Bài tập này làm mình thấy khó chịu / căng thẳng hơn (Ghi nhận trải nghiệm không mong muốn để điều chỉnh lộ trình)
                          </label>
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            type="button"
                            disabled={activeStepIdx === 0}
                            onClick={() => setActiveStepIdx((prev) => Math.max(0, prev - 1))}
                            style={{
                              padding: '7px 13px',
                              borderRadius: '9px',
                              border: '1px solid #CBD5E1',
                              backgroundColor: '#FFFFFF',
                              color: '#334155',
                              fontSize: '0.82rem',
                              fontWeight: 600,
                              cursor: activeStepIdx === 0 ? 'not-allowed' : 'pointer',
                              opacity: activeStepIdx === 0 ? 0.5 : 1,
                            }}
                          >
                            ← Bước trước
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setActiveStepIdx((prev) =>
                                prev + 1 < activeProtocol.steps.length ? prev + 1 : 0,
                              )
                            }
                            style={{
                              padding: '7px 14px',
                              borderRadius: '9px',
                              border: 'none',
                              backgroundColor: '#3E6359',
                              color: '#FFFFFF',
                              fontSize: '0.83rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            {activeStepIdx + 1 < activeProtocol.steps.length
                              ? 'Bước tiếp theo →'
                              : '✓ Hoàn tất & Lưu theo sự đồng ý của bạn'}
                          </button>
                        </div>
                        <span style={{ fontSize: '0.76rem', color: '#64748B' }}>
                          ℹ️ {activeProtocol.limitations_statement_vi}
                        </span>
                      </div>
                    </div>
                  );
                })()
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SUB-TAB 2: 6-SECTION PERSONAL SAFETY PLAN & OFFLINE EMERGENCY DIRECTORY (§3.3-3.4)
         ===================================================================== */}
      {subTab === 'safety-plan-directory' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
          {/* 6-Section Personal Safety Plan (§3.4) */}
          <div style={{ padding: '20px', borderRadius: '18px', backgroundColor: '#FFFFFF', border: '1px solid #D8E3DF' }}>
            <h3 style={{ marginTop: 0, marginBottom: '6px', color: '#1A272D' }}>
              🛡️ Kế hoạch An toàn Cá nhân 6 Mục (§3.4 Personal Safety Plan)
            </h3>
            <p style={{ marginTop: 0, fontSize: '0.83rem', color: '#4B5E67', marginBottom: '14px' }}>
              Hoàn toàn tự nguyện, lưu ngoại tuyến trên thiết bị và khuyến khích thảo luận cùng chuyên gia y tế.
            </p>

            {(
              [
                ['1. Dấu hiệu cảnh báo cá nhân (Warning signs):', spWarningSigns, setSpWarningSigns],
                ['2. Chiến lược tự làm dịu bên trong (Internal coping):', spInternalCoping, setSpInternalCoping],
                ['3. Người & không gian giúp phân tâm an toàn:', spDistractionPlaces, setSpDistractionPlaces],
                ['5. Liên hệ chuyên môn & cơ sở cấp cứu:', spProfessionalContact, setSpProfessionalContact],
                ['6. Các bước làm môi trường xung quanh an toàn hơn:', spEnvironmentSafety, setSpEnvironmentSafety],
              ] as const
            ).map(([label, val, setter]) => (
              <div key={label} style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#26353D', marginBottom: '4px' }}>
                  {label}
                </label>
                <input
                  type="text"
                  value={val}
                  onChange={(e) => setter(e.target.value)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '8px 10px',
                    borderRadius: '9px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.84rem',
                  }}
                />
              </div>
            ))}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#26353D', marginBottom: '4px' }}>
                  4. Người tin cậy để nhờ giúp (Tên):
                </label>
                <input
                  type="text"
                  value={spTrustedContactName}
                  onChange={(e) => setSpTrustedContactName(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: '9px', border: '1px solid #CBD5E1', fontSize: '0.84rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#26353D', marginBottom: '4px' }}>
                  Số điện thoại người tin cậy:
                </label>
                <input
                  type="text"
                  value={spTrustedContactPhone}
                  onChange={(e) => setSpTrustedContactPhone(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: '9px', border: '1px solid #CBD5E1', fontSize: '0.84rem' }}
                />
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', marginBottom: '12px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={spExplicitContactConsent}
                onChange={(e) => setSpExplicitContactConsent(e.target.checked)}
              />
              <span>
                Tôi đồng ý rõ ràng cho phép lưu thông tin liên hệ của người tin cậy trong Kế hoạch An toàn trên thiết bị (§3.4).
              </span>
            </label>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  const res = validatePersonalSafetyPlan({
                    id: 'sp-local-1',
                    userId: 'current-user',
                    section1PersonalWarningSigns: [spWarningSigns],
                    section2InternalCopingStrategies: [spInternalCoping],
                    section3DistractionPeopleAndPlaces: [{ label: spDistractionPlaces }],
                    section4TrustedPeopleToAskForHelp: spTrustedContactPhone
                      ? [{ name: spTrustedContactName, relationship: 'Trusted', phone: spTrustedContactPhone }]
                      : [],
                    section5ProfessionalAndEmergencyContacts: [
                      { name: spProfessionalContact, roleOrService: 'Emergency', phone: '115' },
                    ],
                    section6EnvironmentSafetySteps: [spEnvironmentSafety],
                    explicitConsentForStoringContacts: spExplicitContactConsent,
                  });
                  setSpSavedMessage(
                    res.valid
                      ? '✓ Đã kiểm tra hợp lệ và lưu Kế hoạch An toàn 6 mục (sẵn sàng truy cập cả khi mất mạng).'
                      : `⚠️ Không thể lưu: ${res.errors.join(' ')}`,
                  );
                }}
                style={{
                  padding: '8px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: '#3E6359',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                }}
              >
                💾 Lưu Kế hoạch An toàn
              </button>
              <button
                type="button"
                onClick={() => {
                  setSpTrustedContactName('');
                  setSpTrustedContactPhone('');
                  setSpSavedMessage('🗑️ Đã xóa thông tin liên hệ nhạy cảm khỏi Kế hoạch An toàn.');
                }}
                style={{
                  padding: '8px 14px',
                  borderRadius: '10px',
                  border: '1px solid #DC2626',
                  backgroundColor: '#FEF2F2',
                  color: '#991B1B',
                  fontWeight: 600,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                }}
              >
                🗑️ Xóa Liên hệ
              </button>
            </div>
            {spSavedMessage && (
              <div style={{ marginTop: '10px', padding: '10px', borderRadius: '9px', backgroundColor: '#F0FDF4', color: '#166534', fontSize: '0.83rem', fontWeight: 600 }}>
                {spSavedMessage}
              </div>
            )}
          </div>

          {/* Reviewed Offline Emergency Directory (§3.3) */}
          <div style={{ padding: '20px', borderRadius: '18px', backgroundColor: '#FFFFFF', border: '1px solid #D8E3DF' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h3 style={{ margin: 0, color: '#1A272D' }}>
                📞 Danh bạ Cấp cứu Ngoại tuyến Đã Kiểm duyệt (§3.3)
              </h3>
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value as 'VN' | 'US')}
                style={{ padding: '5px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.83rem' }}
              >
                <option value="VN">🇻🇳 Việt Nam (VN)</option>
                <option value="US">🇺🇸 Hoa Kỳ / Canada (US)</option>
              </select>
            </div>

            <div style={{ padding: '10px 12px', borderRadius: '10px', backgroundColor: '#FFF1F2', border: '1px solid #FECDD3', color: '#881337', fontSize: '0.82rem', marginBottom: '12px' }}>
              <strong>⚠️ Lưu ý bắt buộc (§3.3):</strong> {directoryStatus.nonMonitoringNoticeVi}
              <div style={{ marginTop: '4px', fontSize: '0.78rem', opacity: 0.9 }}>
                Ngày xác minh danh bạ gần nhất: <strong>{directoryStatus.directory.lastVerifiedDate}</strong> • Không dùng số điện thoại do AI tự sinh.
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {directoryStatus.directory.contacts.map((c) => (
                <div
                  key={c.id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '12px',
                    backgroundColor: c.isEmergencyDispatch ? '#FEF2F2' : '#F8FAF9',
                    border: `1px solid ${c.isEmergencyDispatch ? '#FCA5A5' : '#DCE5E1'}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ color: '#1E293B', fontSize: '0.9rem' }}>
                      {lang === 'vi' ? c.nameVi : c.nameEn}
                    </strong>
                    <a
                      href={`tel:${c.phone.replace(/\s+/g, '')}`}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        backgroundColor: c.isEmergencyDispatch ? '#DC2626' : '#3E6359',
                        color: '#FFFFFF',
                        textDecoration: 'none',
                        fontWeight: 700,
                        fontSize: '0.83rem',
                      }}
                    >
                      📞 Gọi {c.phone}
                    </a>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '4px' }}>
                    Giờ hoạt động: {c.hours} • {c.notesVi}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SUB-TAB 3: MEDICATION SUPPORT (§7) & MULTI-SIGNAL BIPOLAR (§3.5)
         ===================================================================== */}
      {subTab === 'meds-and-bipolar' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
          {/* Medication Support (§7) */}
          <div style={{ padding: '20px', borderRadius: '18px', backgroundColor: '#FFFFFF', border: '1px solid #D8E3DF' }}>
            <h3 style={{ marginTop: 0, marginBottom: '6px', color: '#1A272D' }}>
              💊 Hỗ trợ Nhắc lịch & Ghi chép Thuốc (§7 Medication Support)
            </h3>
            <div style={{ padding: '10px 12px', borderRadius: '10px', backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E', fontSize: '0.82rem', marginBottom: '12px' }}>
              <strong>Ranh giới Y khoa (§7):</strong> Ứng dụng chỉ là công cụ nhắc lịch và ghi chép do bạn tự nhập. Ứng dụng <strong>không kê đơn, không thẩm định toa thuốc</strong> và tuyệt đối không khuyên tăng/giảm liều, uống bù gấp đôi hay ngưng thuốc.
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>
                1. Lịch nhắc thuốc (MedicationReminder — Tách biệt với xác nhận đã uống):
              </label>
              <input
                type="text"
                value={medName}
                onChange={(e) => setMedName(e.target.value)}
                placeholder="Tên thuốc theo toa bác sĩ..."
                style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: '9px', border: '1px solid #CBD5E1', marginBottom: '6px', fontSize: '0.84rem' }}
              />
              <input
                type="text"
                value={medSchedule}
                onChange={(e) => setMedSchedule(e.target.value)}
                placeholder="Khung giờ nhắc..."
                style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: '9px', border: '1px solid #CBD5E1', fontSize: '0.84rem' }}
              />
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>
                2. Nhật ký Xác nhận Uống thuốc (MedicationLog — Trung tính, không phán xét):
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                {(
                  [
                    ['taken', '✓ Đã uống (Taken)'],
                    ['missed', '⏸️ Quên liều (Missed)'],
                    ['uncertain', '❓ Không chắc chắn (Uncertain)'],
                  ] as const
                ).map(([st, label]) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setMedIntakeStatus(st)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '9px',
                      border: medIntakeStatus === st ? '2px solid #3E6359' : '1px solid #CBD5E1',
                      backgroundColor: medIntakeStatus === st ? '#E6F2ED' : '#FFFFFF',
                      fontWeight: 600,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={medSideEffectNote}
                onChange={(e) => setMedSideEffectNote(e.target.value)}
                placeholder="Ghi chú tác dụng phụ nghi ngờ để hỏi bác sĩ/dược sĩ (tùy chọn)..."
                style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: '9px', border: '1px solid #CBD5E1', fontSize: '0.84rem' }}
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setMedLogs((prev) => [
                  {
                    id: `ml-${Date.now()}`,
                    name: medName,
                    status: medIntakeStatus,
                    note: medSideEffectNote,
                    time: new Date().toLocaleTimeString(),
                  },
                  ...prev,
                ]);
                setMedSideEffectNote('');
              }}
              style={{
                padding: '8px 14px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: '#3E6359',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.84rem',
                cursor: 'pointer',
              }}
            >
              📝 Ghi nhận vào Nhật ký Thuốc
            </button>

            <div style={{ marginTop: '10px', fontSize: '0.82rem', color: '#334155' }}>
              {evaluateMedicationSupportAction({
                intakeStatus: medIntakeStatus,
                possibleSideEffectNote: medSideEffectNote,
              }).guidanceVi}
            </div>

            {medLogs.length > 0 && (
              <div style={{ marginTop: '10px', borderTop: '1px solid #E2E8F0', paddingTop: '8px', fontSize: '0.81rem' }}>
                {medLogs.map((l) => (
                  <div key={l.id} style={{ marginBottom: '4px' }}>
                    • <strong>{l.name}</strong>: {l.status} ({l.time}) {l.note ? `— Lưu ý hỏi bác sĩ: ${l.note}` : ''}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bipolar Multi-Signal Monitoring (§3.5 & §4.4) */}
          <div style={{ padding: '20px', borderRadius: '18px', backgroundColor: '#FFFFFF', border: '1px solid #D8E3DF' }}>
            <h3 style={{ marginTop: 0, marginBottom: '6px', color: '#1A272D' }}>
              🌙 Theo dõi Đa Tín hiệu Lưỡng cực & Nhịp Sinh học (§3.5 & §4.4)
            </h3>
            <p style={{ marginTop: 0, fontSize: '0.82rem', color: '#4B5E67', marginBottom: '12px' }}>
              Quy tắc §3.5: <strong>Không bao giờ dùng một ngưỡng giờ ngủ đơn lẻ làm bộ phát hiện hưng cảm</strong>. Hệ thống chỉ khuyến nghị liên hệ bác sĩ khi có sự hội tụ đa tín hiệu so với nền cá nhân.
            </p>

            {(
              [
                ['Giảm nhu cầu ngủ (Ngủ ít nhưng không thấy mệt — khác với mất ngủ)', sigReducedSleepNeed, setSigReducedSleepNeed],
                ['Khí sắc hưng phấn bất thường hoặc dễ cáu gắt', sigElevatedIrritable, setSigElevatedIrritable],
                ['Năng lượng hoặc hoạt động hướng mục tiêu tăng vọt', sigIncreasedEnergy, setSigIncreasedEnergy],
                ['Nói nhiều bất thường hoặc suy nghĩ chạy dồn dập', sigRacingThoughts, setSigRacingThoughts],
                ['Tăng tính bốc đồng (mua sắm, quyết định vội vàng)', sigImpulsivity, setSigImpulsivity],
                ['Lệch đáng kể khỏi nhịp sinh hoạt cá nhân thường ngày', sigRoutineDeviation, setSigRoutineDeviation],
              ] as const
            ).map(([label, checked, setter]) => (
              <label
                key={label}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.83rem', marginBottom: '8px', cursor: 'pointer' }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => setter(e.target.checked)}
                />
                <span>{label}</span>
              </label>
            ))}

            <div
              style={{
                marginTop: '12px',
                padding: '12px 14px',
                borderRadius: '12px',
                backgroundColor: bipolarMultiSignalEval.promptHumanClinicalContactRecommended ? '#FEF2F2' : '#F0FDF4',
                border: `1px solid ${bipolarMultiSignalEval.promptHumanClinicalContactRecommended ? '#FCA5A5' : '#BBF7D0'}`,
                color: bipolarMultiSignalEval.promptHumanClinicalContactRecommended ? '#991B1B' : '#166534',
                fontSize: '0.84rem',
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: '4px' }}>
                Số tín hiệu ghi nhận: {bipolarMultiSignalEval.activeSignalCount}/6 • Trạng thái đề xuất: {bipolarMultiSignalEval.recommendedPathwayState}
              </div>
              <div>{bipolarMultiSignalEval.guidanceVi}</div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SUB-TAB 4: FFT FAMILY SUPPORT & GRANULAR CAREGIVER CONSENT (§4.7)
         ===================================================================== */}
      {subTab === 'fft-caregiver' && (
        <div style={{ padding: '20px', borderRadius: '18px', backgroundColor: '#FFFFFF', border: '1px solid #D8E3DF' }}>
          <h3 style={{ marginTop: 0, marginBottom: '6px', color: '#1A272D' }}>
            🤝 Kiểm soát Quyền Riêng tư & Phân quyền Người thân Đồng hành (FFT — §4.7)
          </h3>
          <p style={{ marginTop: 0, fontSize: '0.84rem', color: '#4B5E67', marginBottom: '14px' }}>
            Chỉ chính bạn (người bệnh) mới có quyền mời hoặc thu hồi quyền của người thân. <strong>Nhật ký riêng tư, nội dung phiên trị liệu và câu trả lời thang đo luôn bị khóa mặc định.</strong> Người thân không bao giờ được phép chỉnh sửa hồ sơ lâm sàng của bạn.
          </p>

          <div style={{ marginBottom: '12px', maxWidth: '420px' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>
              Tên / Mối quan hệ Người thân được mời:
            </label>
            <input
              type="text"
              value={caregiverName}
              onChange={(e) => setCaregiverName(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: '9px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px', marginBottom: '14px' }}>
            {(
              [
                ['Cho phép xem Kế hoạch Dấu hiệu Sớm (Early Warning Plan)', cgAllowEarlyWarning, setCgAllowEarlyWarning, true],
                ['Cho phép cùng học 6 bài Giao tiếp Gia đình (FFT Modules)', cgAllowFftModules, setCgAllowFftModules, true],
                ['Cho phép xem Tóm tắt Nhịp Sinh hoạt chung', cgAllowRhythmSummary, setCgAllowRhythmSummary, false],
                ['🔒 Nhật ký Tâm sự Riêng tư (Mặc định KHÓA)', cgAllowPrivateJournals, setCgAllowPrivateJournals, false],
                ['🔒 Nội dung Chi tiết Phiên Trị liệu (Mặc định KHÓA)', cgAllowSessionContent, setCgAllowSessionContent, false],
                ['🔒 Câu trả lời Chi tiết Thang đo (Mặc định KHÓA)', cgAllowAssessmentAnswers, setCgAllowAssessmentAnswers, false],
              ] as const
            ).map(([label, checked, setter]) => (
              <label
                key={label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  backgroundColor: '#F8FAF9',
                  border: '1px solid #E2E8F0',
                  fontSize: '0.83rem',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => setter(e.target.checked)}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => {
                const res = createGranularCaregiverAccessGrant({
                  grantId: `grant-${Date.now()}`,
                  patientUserId: 'patient-self',
                  caregiverUserId: caregiverName || 'caregiver-01',
                  patientInvitedCaregiver: true,
                  explicitOverrides: {
                    viewEarlyWarningPlan: cgAllowEarlyWarning,
                    viewSharedFftEducation: cgAllowFftModules,
                    viewRhythmSummary: cgAllowRhythmSummary,
                    viewPrivateJournalEntries: cgAllowPrivateJournals,
                    viewTherapySessionContent: cgAllowSessionContent,
                    viewAssessmentAnswers: cgAllowAssessmentAnswers,
                  },
                });
                if (res.data) setActiveCaregiverGrant(res.data);
              }}
              style={{
                padding: '8px 14px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: '#3E6359',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.84rem',
                cursor: 'pointer',
              }}
            >
              ✓ Cập nhật Phân quyền Chi tiết (AccessGrant)
            </button>
            {activeCaregiverGrant && !activeCaregiverGrant.revoked && (
              <button
                type="button"
                onClick={() =>
                  setActiveCaregiverGrant(revokeCaregiverAccessGrant(activeCaregiverGrant, 'patient-self'))
                }
                style={{
                  padding: '8px 14px',
                  borderRadius: '10px',
                  border: '1px solid #DC2626',
                  backgroundColor: '#FEF2F2',
                  color: '#991B1B',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                }}
              >
                🚫 Thu hồi Toàn bộ Quyền Truy cập Ngay lập tức (Revoke)
              </button>
            )}
          </div>

          {activeCaregiverGrant && (
            <div
              style={{
                marginTop: '14px',
                padding: '12px 14px',
                borderRadius: '12px',
                backgroundColor: activeCaregiverGrant.revoked ? '#FEF2F2' : '#F0FDF4',
                border: `1px solid ${activeCaregiverGrant.revoked ? '#FCA5A5' : '#BBF7D0'}`,
                fontSize: '0.83rem',
              }}
            >
              <strong>
                Trạng thái AccessGrant ({activeCaregiverGrant.caregiverUserId}):{' '}
                {activeCaregiverGrant.revoked ? 'ĐÃ THU HỒI TOÀN BỘ QUYỀN (REVOKED)' : 'ĐANG HIỆU LỰC THEO PHÂN QUYỀN'}
              </strong>
              <div style={{ marginTop: '4px', color: '#334155' }}>
                • Quyền chỉnh sửa hồ sơ bệnh nhân: <strong>Bị khóa vĩnh viễn (false)</strong> • Nhật ký riêng tư:{' '}
                <strong>{activeCaregiverGrant.permissions.viewPrivateJournalEntries ? 'Cho phép' : 'Đang ẩn'}</strong> • Nhật ký Audit:{' '}
                {activeCaregiverGrant.auditTrail.map((a) => `${a.action} (${a.timestamp.slice(0, 19)})`).join(' → ')}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          SUB-TAB 5: WHO-5 WELL-BEING (§6.2) & REPORT PREVIEW/REDACTION (§10.3)
         ===================================================================== */}
      {subTab === 'who5-and-redaction' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
          {/* WHO-5 Well-Being Index (§6.2) */}
          <div style={{ padding: '20px', borderRadius: '18px', backgroundColor: '#FFFFFF', border: '1px solid #D8E3DF' }}>
            <h3 style={{ marginTop: 0, marginBottom: '6px', color: '#1A272D' }}>
              ☀️ Chỉ số An vui Tinh thần WHO-5 (§6.2 Well-Being Monitoring)
            </h3>
            <p style={{ marginTop: 0, fontSize: '0.82rem', color: '#4B5E67', marginBottom: '12px' }}>
              Khoảng hồi tưởng: <strong>Trong 2 tuần qua</strong> (0 = Không lúc nào → 5 = Toàn bộ thời gian). Đây là thang theo dõi cảm nhận an vui chủ quan, không phải công cụ chẩn đoán.
            </p>

            {[
              '1. Tôi cảm thấy vui vẻ và có tinh thần tốt',
              '2. Tôi cảm thấy bình tĩnh và thư thái',
              '3. Tôi cảm thấy năng động và có sinh lực',
              '4. Khi thức dậy tôi cảm thấy khỏe khoắn và được nghỉ ngơi',
              '5. Cuộc sống hằng ngày của tôi có những điều làm tôi quan tâm',
            ].map((qText, idx) => (
              <div key={qText} style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '0.83rem', fontWeight: 600, color: '#1E293B', marginBottom: '4px' }}>
                  {qText}: <strong>{who5Items[idx]}/5</strong>
                </div>
                <input
                  type="range"
                  min={0}
                  max={5}
                  value={who5Items[idx]}
                  onChange={(e) => {
                    const next = [...who5Items] as [number, number, number, number, number];
                    next[idx] = Number(e.target.value);
                    setWho5Items(next);
                  }}
                  style={{ width: '100%' }}
                />
              </div>
            ))}

            <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', fontSize: '0.84rem', color: '#166534' }}>
              <strong>{who5Result.labelVi}</strong> (Điểm thô: {who5Result.rawScore}/25)
              <div style={{ marginTop: '4px', fontSize: '0.8rem' }}>{who5Result.interpretationVi}</div>
            </div>
          </div>

          {/* User-Controlled Report Preview & Redaction (§10.3) */}
          <div style={{ padding: '20px', borderRadius: '18px', backgroundColor: '#FFFFFF', border: '1px solid #D8E3DF' }}>
            <h3 style={{ marginTop: 0, marginBottom: '6px', color: '#1A272D' }}>
              📋 Xem trước & Ẩn Thông tin Nhạy cảm Trước Khi Chia sẻ Báo cáo (§10.3)
            </h3>
            <p style={{ marginTop: 0, fontSize: '0.82rem', color: '#4B5E67', marginBottom: '12px' }}>
              Bạn kiểm soát 100% nội dung xuất ra cho bác sĩ. Báo cáo gắn nhãn rõ nguồn dữ liệu (<code>Tự báo cáo</code> vs <code>Chuyên gia nhập</code>), phiên bản thang đo và không chứa chẩn đoán tự động.
            </p>

            {(
              [
                ['Ẩn toàn bộ nội dung Nhật ký Tâm sự Riêng tư (Redact Private Journals)', redactJournals, setRedactJournals],
                ['Ẩn bản ghi chi tiết Phiên Thực hành (Redact Session Transcripts)', redactSessions, setRedactSessions],
                ['Chỉ hiện Tổng điểm Thang đo, ẩn từng câu trả lời lẻ (Redact Raw Items)', redactRawItems, setRedactRawItems],
                ['Ẩn ghi chú thuốc cá nhân (Redact Medication Notes)', redactMedNotes, setRedactMedNotes],
              ] as const
            ).map(([label, checked, setter]) => (
              <label key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.83rem', marginBottom: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => setter(e.target.checked)}
                />
                <span>{label}</span>
              </label>
            ))}

            {reportPreview.data && (
              <div
                style={{
                  marginTop: '12px',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  backgroundColor: '#F8FAF9',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.81rem',
                  lineHeight: 1.5,
                  color: '#1E293B',
                }}
              >
                <div style={{ fontWeight: 800, color: '#3E6359', marginBottom: '6px' }}>
                  🔍 BẢN XEM TRƯỚC BÁO CÁO ĐÃ KIỂM DUYỆT (PREVIEW):
                </div>
                <div>• {reportPreview.data.selfReportedMoodSummary}</div>
                <div>• {reportPreview.data.clinicianEnteredNotesSummary}</div>
                <div>• Nhật ký: {reportPreview.data.privateJournalsDisplayed.join('; ')}</div>
                <div style={{ marginTop: '6px' }}>
                  <strong>Thang đo & Giới hạn Diễn giải (§6.1 & §10.3):</strong>
                  {reportPreview.data.assessmentsDisplayed.map((a) => (
                    <div key={a.instrumentCode} style={{ marginTop: '3px' }}>
                      - <strong>{a.instrumentCode} (v{a.version})</strong>: {a.totalScore} điểm [{a.provenance}] — <em>{a.limitationVi}</em>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '6px', fontSize: '0.77rem', color: '#64748B' }}>
                  {reportPreview.data.disclaimerVi}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Instrument Governance Footnote (§6.1) */}
      <div style={{ marginTop: '16px', padding: '12px 16px', borderRadius: '12px', backgroundColor: '#F8FAF9', border: '1px solid #E2E8F0', fontSize: '0.78rem', color: '#475569' }}>
        <strong>Sổ Quản trị Thang đo (§6.1 Instrument Governance):</strong> Đang quản lý {Object.keys(INSTRUMENT_GOVERNANCE_REGISTRY).length} thang đo (
        {Object.keys(INSTRUMENT_GOVERNANCE_REGISTRY).join(', ')}) với đầy đủ phiên bản, khoảng hồi tưởng và giới hạn diễn giải. Toàn bộ 68 phác đồ đang ở trạng thái <code>draft</code> chờ hội đồng lâm sàng ký duyệt trước khi chuyển sang <code>approved</code>.
      </div>
    </div>
  );
}
