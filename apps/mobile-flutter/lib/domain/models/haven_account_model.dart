// lib/domain/models/haven_account_model.dart
// Haven (Equilibria) Patient-Centered Account Profile & Emotional Sanctuary Presets.
// Uses personal emotional need spaces (zero fictional persona names) and hardware-backed
// local encrypted persistence without requiring cloud login.

import 'clinical_models.dart';

class HavenAccountProfile {
  final String userId;
  final String displayName;
  final String email;
  final DisorderFocus disorderFocus;
  final String authMode; // 'sanctuary-space' | 'guest-local-only' | 'email-local-e2ee'
  final String emergencyContactName;
  final String emergencyContactPhone;
  final bool biometricLockEnabled;
  final String createdAtIso;

  const HavenAccountProfile({
    required this.userId,
    required this.displayName,
    required this.email,
    required this.disorderFocus,
    this.authMode = 'sanctuary-space',
    this.emergencyContactName = '',
    this.emergencyContactPhone = '',
    this.biometricLockEnabled = false,
    required this.createdAtIso,
  });

  HavenAccountProfile copyWith({
    String? userId,
    String? displayName,
    String? email,
    DisorderFocus? disorderFocus,
    String? authMode,
    String? emergencyContactName,
    String? emergencyContactPhone,
    bool? biometricLockEnabled,
    String? createdAtIso,
  }) {
    return HavenAccountProfile(
      userId: userId ?? this.userId,
      displayName: displayName ?? this.displayName,
      email: email ?? this.email,
      disorderFocus: disorderFocus ?? this.disorderFocus,
      authMode: authMode ?? this.authMode,
      emergencyContactName: emergencyContactName ?? this.emergencyContactName,
      emergencyContactPhone:
          emergencyContactPhone ?? this.emergencyContactPhone,
      biometricLockEnabled: biometricLockEnabled ?? this.biometricLockEnabled,
      createdAtIso: createdAtIso ?? this.createdAtIso,
    );
  }

  Map<String, dynamic> toJson() => {
        'userId': userId,
        'displayName': displayName,
        'email': email,
        'disorderFocus': disorderFocus.code,
        'authMode': authMode,
        'emergencyContactName': emergencyContactName,
        'emergencyContactPhone': emergencyContactPhone,
        'biometricLockEnabled': biometricLockEnabled,
        'createdAtIso': createdAtIso,
      };

  factory HavenAccountProfile.fromJson(Map<String, dynamic> json) {
    return HavenAccountProfile(
      userId: json['userId'] as String? ?? 'haven-local-user',
      displayName: json['displayName'] as String? ?? 'Bạn',
      email: json['email'] as String? ?? 'local@haven.sanctuary',
      disorderFocus: DisorderFocus.fromCode(
        json['disorderFocus'] as String? ?? DisorderFocus.anxiety.code,
      ),
      authMode: json['authMode'] as String? ?? 'sanctuary-space',
      emergencyContactName: json['emergencyContactName'] as String? ?? '',
      emergencyContactPhone: json['emergencyContactPhone'] as String? ?? '',
      biometricLockEnabled: json['biometricLockEnabled'] as bool? ?? false,
      createdAtIso: json['createdAtIso'] as String? ??
          DateTime.now().toUtc().toIso8601String(),
    );
  }
}

class HavenSanctuaryPreset {
  final String id;
  final String titleVi;
  final String badgeVi;
  final String descriptionVi;
  final DisorderFocus disorderFocus;
  final int defaultMoodPolarity;
  final int defaultEnergyLevel;
  final String authMode;

  const HavenSanctuaryPreset({
    required this.id,
    required this.titleVi,
    required this.badgeVi,
    required this.descriptionVi,
    required this.disorderFocus,
    required this.defaultMoodPolarity,
    required this.defaultEnergyLevel,
    required this.authMode,
  });
}

const List<HavenSanctuaryPreset> kHavenSanctuaryPresets = [
  HavenSanctuaryPreset(
    id: 'anxiety-calm',
    titleVi: 'Hỗ Trợ Lo Âu & Căng Thẳng [RLLA]',
    badgeVi: 'RLLA • Làm dịu thần kinh',
    descriptionVi:
        'Tập trung làm dịu bồn chồn, Chiếc hộp gác lại âu lo, Thở điều hòa 4-6 & Thang bước nhỏ đối diện nỗi sợ.',
    disorderFocus: DisorderFocus.anxiety,
    defaultMoodPolarity: 0,
    defaultEnergyLevel: 0,
    authMode: 'sanctuary-space',
  ),
  HavenSanctuaryPreset(
    id: 'depression-gentle',
    titleVi: 'Hỗ Trợ Vượt Qua Trầm Cảm [TC]',
    badgeVi: 'TC • Một bước nhỏ dịu dàng',
    descriptionVi:
        'Giao diện dịu nhẹ năng lượng thấp, không áp lực đếm chuỗi ngày đứt, ưu tiên một bước nhỏ vừa sức mỗi ngày.',
    disorderFocus: DisorderFocus.depression,
    defaultMoodPolarity: -3,
    defaultEnergyLevel: -2,
    authMode: 'sanctuary-space',
  ),
  HavenSanctuaryPreset(
    id: 'bipolar-balance',
    titleVi: 'Cân Bằng Cảm Xúc & Giấc Ngủ [RLLC]',
    badgeVi: 'RLLC • Nhịp sinh học IPSRT',
    descriptionVi:
        'Theo dõi khí sắc hai cực, 5 mốc nhịp sinh học IPSRT, Khoang chờ 48 giờ và Kế hoạch Ulysses bảo vệ giấc ngủ.',
    disorderFocus: DisorderFocus.bipolar1,
    defaultMoodPolarity: 0,
    defaultEnergyLevel: 0,
    authMode: 'sanctuary-space',
  ),
  HavenSanctuaryPreset(
    id: 'guest-local-only',
    titleVi: 'Trải Nghiệm Ẩn Danh Tại Chỗ [RLLA/TC/RLLC]',
    badgeVi: 'Bảo mật ngoại tuyến',
    descriptionVi:
        'Không cần email hay tài khoản đám mây. Toàn bộ nhật ký được mã hóa phần cứng ngay trên điện thoại của bạn.',
    disorderFocus: DisorderFocus.anxiety,
    defaultMoodPolarity: 0,
    defaultEnergyLevel: 0,
    authMode: 'guest-local-only',
  ),
];
