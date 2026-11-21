// lib/presentation/screens/assessment_runner_screen.dart
// Interactive Clinical Questionnaire Runner for PHQ-9, GAD-7, BMS, ISI, ASRM & MDQ:
// - Displays live completion progress indicator
// - Thumb-friendly radio pill choices matching Web Haven UX
// - Computes real scores via ClinicalAssessmentsEngine and pops back with AssessmentRecord.

import 'package:flutter/material.dart';

import '../../domain/engine/clinical_assessments.dart';
import '../../domain/models/clinical_models.dart';

class AssessmentRunnerScreen extends StatefulWidget {
  final String scaleCode;
  final FeltNeedForSleep feltNeedForSleep;

  const AssessmentRunnerScreen({
    super.key,
    required this.scaleCode,
    required this.feltNeedForSleep,
  });

  @override
  State<AssessmentRunnerScreen> createState() => _AssessmentRunnerScreenState();
}

class _AssessmentRunnerScreenState extends State<AssessmentRunnerScreen> {
  final ClinicalAssessmentsEngine _engine = const ClinicalAssessmentsEngine();
  final Map<int, int> _answers = <int, int>{};
  bool _mdqCoOccurred = true;
  bool _mdqModerateImpairment = true;

  ClinicalScaleDefinition get _definition =>
      kClinicalScalesRegistry[widget.scaleCode] ??
      kClinicalScalesRegistry['PHQ-9']!;

  void _submitAssessment() {
    final def = _definition;
    final rawAnswers = List<int>.generate(
      def.questions.length,
      (idx) => _answers[idx] ?? 0,
    );

    final result = _engine.scoreFromQuestionnaire(
      scaleCode: def.scaleCode,
      rawAnswers: rawAnswers,
      mdqCoOccurred: _mdqCoOccurred,
      mdqModerateImpairment: _mdqModerateImpairment,
      feltNeedForSleep: widget.feltNeedForSleep,
    );

    Navigator.of(context).pop(result);
  }

  @override
  Widget build(BuildContext context) {
    final def = _definition;
    final scheme = Theme.of(context).colorScheme;
    final answeredCount = _answers.length;
    final totalCount = def.questions.length;
    final progress = totalCount > 0 ? answeredCount / totalCount : 0.0;

    return Scaffold(
      appBar: AppBar(
        title: Text(
          def.titleVi,
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 14),
            child: Center(
              child: Text(
                '$answeredCount/$totalCount câu',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: scheme.primary,
                ),
              ),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          LinearProgressIndicator(
            value: progress,
            minHeight: 5,
            backgroundColor: scheme.primary.withValues(alpha: 0.14),
            valueColor: AlwaysStoppedAnimation<Color>(
              answeredCount == totalCount ? scheme.secondary : scheme.primary,
            ),
          ),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 24),
              children: [
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: scheme.secondary.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: scheme.secondary.withValues(alpha: 0.35),
                    ),
                  ),
                  child: Text(
                    '🕒 Khung thời gian đánh giá: ${def.timeframeVi}',
                    style: const TextStyle(
                      fontSize: 13.5,
                      fontWeight: FontWeight.w600,
                      height: 1.45,
                    ),
                  ),
                ),
                const SizedBox(height: 14),
                for (int qIdx = 0; qIdx < def.questions.length; qIdx++) ...[
                  _buildQuestionCard(
                    def: def,
                    questionIndex: qIdx,
                    question: def.questions[qIdx],
                    scheme: scheme,
                  ),
                  const SizedBox(height: 12),
                ],
                if (def.scaleCode == 'MDQ') _buildMdqSupplementaryCard(scheme),
                const SizedBox(height: 12),
              ],
            ),
          ),
          SafeArea(
            top: false,
            child: Container(
              padding: const EdgeInsets.fromLTRB(16, 10, 16, 14),
              decoration: BoxDecoration(
                color: Theme.of(context).scaffoldBackgroundColor,
                border: Border(
                  top: BorderSide(
                    color: scheme.outlineVariant.withValues(alpha: 0.5),
                  ),
                ),
              ),
              child: Row(
                children: [
                  OutlinedButton(
                    onPressed: () => Navigator.of(context).pop(),
                    child: const Text('Quay lại'),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: FilledButton(
                      onPressed: _submitAssessment,
                      style: FilledButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                      ),
                      child: const Text(
                        '✓ Hoàn thành và Xem Kết Quả',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuestionCard({
    required ClinicalScaleDefinition def,
    required int questionIndex,
    required ClinicalScaleQuestion question,
    required ColorScheme scheme,
  }) {
    final selectedOpt = _answers[questionIndex];
    final isAnswered = selectedOpt != null;

    return Card(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(
          color: isAnswered ? scheme.primary : const Color(0xFFE6E4DC),
          width: isAnswered ? 1.6 : 1.0,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(15),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                CircleAvatar(
                  radius: 13,
                  backgroundColor: isAnswered
                      ? scheme.primary
                      : scheme.primary.withValues(alpha: 0.14),
                  foregroundColor: isAnswered ? Colors.white : scheme.onSurface,
                  child: Text(
                    '${question.id}',
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    question.textVi,
                    style: const TextStyle(
                      fontSize: 14.5,
                      fontWeight: FontWeight.w600,
                      height: 1.4,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            for (int optIdx = 0; optIdx < def.optionsVi.length; optIdx++)
              Padding(
                padding: const EdgeInsets.only(bottom: 7),
                child: InkWell(
                  borderRadius: BorderRadius.circular(12),
                  onTap: () => setState(() => _answers[questionIndex] = optIdx),
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 11,
                    ),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(12),
                      color: selectedOpt == optIdx
                          ? scheme.primary.withValues(alpha: 0.14)
                          : Colors.transparent,
                      border: Border.all(
                        color: selectedOpt == optIdx
                            ? scheme.primary
                            : const Color(0xFFDCD9CE),
                        width: selectedOpt == optIdx ? 1.8 : 1.0,
                      ),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          selectedOpt == optIdx
                              ? Icons.radio_button_checked
                              : Icons.radio_button_off,
                          size: 18,
                          color: selectedOpt == optIdx
                              ? scheme.primary
                              : const Color(0xFF8C8C84),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            def.optionsVi[optIdx],
                            style: TextStyle(
                              fontSize: 13.5,
                              fontWeight: selectedOpt == optIdx
                                  ? FontWeight.w700
                                  : FontWeight.w500,
                              color: selectedOpt == optIdx
                                  ? scheme.primary
                                  : null,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildMdqSupplementaryCard(ColorScheme scheme) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(15),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Câu hỏi bổ sung lâm sàng (MDQ)',
              style: TextStyle(fontSize: 14.5, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              value: _mdqCoOccurred,
              onChanged: (v) => setState(() => _mdqCoOccurred = v),
              title: const Text(
                'Các biểu hiện "Có" ở trên có từng xảy ra cùng trong một khoảng thời gian không?',
                style: TextStyle(fontSize: 13),
              ),
            ),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              value: _mdqModerateImpairment,
              onChanged: (v) => setState(() => _mdqModerateImpairment = v),
              title: const Text(
                'Những biểu hiện đó có gây khó khăn mức vừa phải hoặc nghiêm trọng cho công việc / gia đình không?',
                style: TextStyle(fontSize: 13),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
