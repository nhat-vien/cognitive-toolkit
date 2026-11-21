// lib/presentation/screens/welcome_gate_screen.dart
// Haven — Serene Onboarding & Sanctuary Entry Screen:
// - Displays 1-Tap SOS Emergency Banner ALWAYS accessible without login (< 300ms)
// - Lets patients choose 1 of 4 personal emotional need spaces (`kHavenSanctuaryPresets`)
//   or create a local hardware-encrypted profile with emergency contact & biometric lock.

import 'dart:async';

import 'package:flutter/material.dart';

import '../../domain/models/clinical_models.dart';
import '../../domain/models/haven_account_model.dart';
import 'sos_portal_screen.dart';

class WelcomeGateScreen extends StatefulWidget {
  final ValueChanged<({HavenAccountProfile profile, int initialMood, int initialEnergy})>
      onEnterSanctuary;

  const WelcomeGateScreen({
    super.key,
    required this.onEnterSanctuary,
  });

  @override
  State<WelcomeGateScreen> createState() => _WelcomeGateScreenState();
}

class _WelcomeGateScreenState extends State<WelcomeGateScreen> {
  final TextEditingController _nameCtrl = TextEditingController();
  final TextEditingController _emailCtrl = TextEditingController();
  final TextEditingController _emergencyNameCtrl = TextEditingController();
  final TextEditingController _emergencyPhoneCtrl = TextEditingController();
  DisorderFocus _selectedFocus = DisorderFocus.anxiety;
  bool _biometricLock = false;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _emergencyNameCtrl.dispose();
    _emergencyPhoneCtrl.dispose();
    super.dispose();
  }

  void _enterWithPreset(HavenSanctuaryPreset preset) {
    final customName = _nameCtrl.text.trim();
    final nowIso = DateTime.now().toUtc().toIso8601String();
    final profile = HavenAccountProfile(
      userId: 'haven_${preset.id}_${DateTime.now().millisecondsSinceEpoch}',
      displayName: customName.isNotEmpty ? customName : preset.titleVi,
      email: _emailCtrl.text.trim().isNotEmpty
          ? _emailCtrl.text.trim()
          : '${preset.id}@haven.local',
      disorderFocus: preset.disorderFocus,
      authMode: preset.authMode,
      emergencyContactName: _emergencyNameCtrl.text.trim(),
      emergencyContactPhone: _emergencyPhoneCtrl.text.trim(),
      biometricLockEnabled: _biometricLock,
      createdAtIso: nowIso,
    );

    widget.onEnterSanctuary((
      profile: profile,
      initialMood: preset.defaultMoodPolarity,
      initialEnergy: preset.defaultEnergyLevel,
    ));
  }

  void _createLocalProfile() {
    final name = _nameCtrl.text.trim().isNotEmpty ? _nameCtrl.text.trim() : 'Bạn';
    final nowIso = DateTime.now().toUtc().toIso8601String();
    final initialMood = _selectedFocus == DisorderFocus.depression ? -3 : 0;
    final initialEnergy = _selectedFocus == DisorderFocus.depression ? -2 : 0;

    final profile = HavenAccountProfile(
      userId: 'haven_local_${DateTime.now().millisecondsSinceEpoch}',
      displayName: name,
      email: _emailCtrl.text.trim().isNotEmpty
          ? _emailCtrl.text.trim()
          : 'local@haven.sanctuary',
      disorderFocus: _selectedFocus,
      authMode: 'email-local-e2ee',
      emergencyContactName: _emergencyNameCtrl.text.trim(),
      emergencyContactPhone: _emergencyPhoneCtrl.text.trim(),
      biometricLockEnabled: _biometricLock,
      createdAtIso: nowIso,
    );

    widget.onEnterSanctuary((
      profile: profile,
      initialMood: initialMood,
      initialEnergy: initialEnergy,
    ));
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;

    return Scaffold(
      backgroundColor: const Color(0xFFFAF9F6),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(18, 16, 18, 32),
          children: [
            // Persistent Always-Accessible 1-Tap SOS Portal
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFFFDF3F0),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE8C4B8)),
              ),
              child: Row(
                children: [
                  const Icon(
                    Icons.shield_moon_outlined,
                    color: Color(0xFFC56548),
                    size: 26,
                  ),
                  const SizedBox(width: 10),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Đang hoảng loạn hoặc quá tải?',
                          style: TextStyle(
                            fontWeight: FontWeight.w700,
                            fontSize: 13,
                            color: Color(0xFF2F2F2B),
                          ),
                        ),
                        Text(
                          'Mở ngay Cổng Bình tĩnh SOS — không cần đăng nhập.',
                          style: TextStyle(
                            fontSize: 12,
                            color: Color(0xFF6B6B63),
                          ),
                        ),
                      ],
                    ),
                  ),
                  FilledButton(
                    style: FilledButton.styleFrom(
                      backgroundColor: const Color(0xFFC56548),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 10,
                      ),
                    ),
                    onPressed: () {
                      unawaited(
                        Navigator.of(context).push(
                          MaterialPageRoute<void>(
                            builder: (_) =>
                                const SosPortalScreen(initialIntensity: 9),
                          ),
                        ),
                      );
                    },
                    child: const Text(
                      'Bình tĩnh ngay',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Brand Identity Header
            Center(
              child: Column(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(20),
                    child: Image.asset(
                      'assets/icon/haven_icon.png',
                      width: 72,
                      height: 72,
                    ),
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Haven — Nơi Bình Yên',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF2F2F2B),
                    ),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'Không gian lắng nghe & chăm sóc tâm trí mỗi ngày\n(CBT • TEAM-CBT • DBT • IPSRT)',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 13.5,
                      height: 1.45,
                      color: Color(0xFF6B6B63),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Optional Gentle Name Field
            TextField(
              controller: _nameCtrl,
              decoration: InputDecoration(
                labelText: 'Tên gọi thân mật của bạn (tùy chọn)',
                hintText: 'VD: An, Minh, Hoặc để trống...',
                prefixIcon: const Icon(Icons.person_outline),
                filled: true,
                fillColor: Colors.white,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: const BorderSide(color: Color(0xFFE6E4DC)),
                ),
              ),
            ),

            const SizedBox(height: 18),

            const Text(
              'Chọn không gian phù hợp với tâm trạng hôm nay',
              style: TextStyle(
                fontSize: 15.5,
                fontWeight: FontWeight.w700,
                color: Color(0xFF2F2F2B),
              ),
            ),
            const SizedBox(height: 4),
            const Text(
              'Chạm một lần để bước vào ngay — toàn bộ dữ liệu được mã hóa AES-256 riêng tư ngay trên thiết bị của bạn.',
              style: TextStyle(fontSize: 12.5, color: Color(0xFF6B6B63)),
            ),
            const SizedBox(height: 12),

            // 4 Personal Emotional Need Space Cards
            for (final preset in kHavenSanctuaryPresets)
              Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: InkWell(
                  borderRadius: BorderRadius.circular(16),
                  onTap: () => _enterWithPreset(preset),
                  child: Container(
                    padding: const EdgeInsets.all(15),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFE6E4DC)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                preset.titleVi,
                                style: const TextStyle(
                                  fontWeight: FontWeight.w700,
                                  fontSize: 15,
                                  color: Color(0xFF2F2F2B),
                                ),
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color: const Color(0xFFEDEAF3),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Text(
                                preset.badgeVi,
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                  color: scheme.primary,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Text(
                          preset.descriptionVi,
                          style: const TextStyle(
                            fontSize: 12.5,
                            height: 1.45,
                            color: Color(0xFF6B6B63),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.end,
                          children: [
                            Text(
                              'Bước vào không gian →',
                              style: TextStyle(
                                fontSize: 12.5,
                                fontWeight: FontWeight.w700,
                                color: scheme.primary,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),

            const SizedBox(height: 8),

            // Collapsible Full Profile Customization Section
            Card(
              child: ExpansionTile(
                leading: const Icon(Icons.lock_outline),
                title: const Text(
                  'Thiết lập Hồ sơ Cá nhân & Liên hệ Khẩn cấp',
                  style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                ),
                childrenPadding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
                children: [
                  TextField(
                    controller: _emailCtrl,
                    keyboardType: TextInputType.emailAddress,
                    decoration: const InputDecoration(
                      labelText: 'Email cá nhân (tùy chọn)',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 10),
                  DropdownButtonFormField<DisorderFocus>(
                    value: _selectedFocus,
                    isExpanded: true,
                    decoration: const InputDecoration(
                      labelText: 'Trọng tâm hỗ trợ chính',
                      border: OutlineInputBorder(),
                    ),
                    items: DisorderFocus.values
                        .map(
                          (f) => DropdownMenuItem(
                            value: f,
                            child: Text(f.labelVi),
                          ),
                        )
                        .toList(),
                    onChanged: (v) {
                      if (v != null) setState(() => _selectedFocus = v);
                    },
                  ),
                  const SizedBox(height: 10),
                  TextField(
                    controller: _emergencyNameCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Người thân tin cậy khi khẩn cấp',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 10),
                  TextField(
                    controller: _emergencyPhoneCtrl,
                    keyboardType: TextInputType.phone,
                    decoration: const InputDecoration(
                      labelText: 'Số điện thoại người thân tin cậy',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  SwitchListTile(
                    contentPadding: EdgeInsets.zero,
                    value: _biometricLock,
                    onChanged: (v) => setState(() => _biometricLock = v),
                    title: const Text(
                      'Khóa nhật ký bằng Face ID / Vân tay',
                      style: TextStyle(fontSize: 13),
                    ),
                  ),
                  const SizedBox(height: 8),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      onPressed: _createLocalProfile,
                      child: const Text('Lưu Hồ sơ & Bắt đầu với Haven'),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 14),

            const Text(
              'Lưu ý Y khoa: Haven là công cụ thực hành tự lực & theo dõi giữa các buổi trị liệu, không thay thế chẩn đoán hay đơn thuốc của bác sĩ chuyên khoa.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 11.5,
                height: 1.4,
                color: Color(0xFF6B6B63),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
