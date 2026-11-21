// lib/presentation/theme/adaptive_clinical_theme.dart
// Dynamic Clinical Theme Engine that automatically adapts to the patient's
// current mood polarity, energy level, and ASRM mania score:
// 1. Standard Theme (Euthymic / Mild Range -2..+1): Calm sage & slate palette.
// 2. Low-Energy Depression Theme (Polarity <= -3):
//    - Collapses dashboard clutter into "One Small Step"
//    - High-legibility warm cream/soft teal contrast
//    - Strictly hides streak counters ("No Broken Streaks") to prevent self-blame
// 3. Low-Stimulus Mania Dark Rest Theme (Polarity >= +2 or ASRM >= 6):
//    - Warm dark amber/sepia palette (eliminates blue light dopaminergic stimulation)
//    - Disables all animations, splash ripples, and celebratory badges
//    - Surfaces the 48-Hour Impulse Vault & Dark Therapy wind-down bar.

import 'package:flutter/material.dart';

enum ClinicalThemeMode {
  standard(
    'standard',
    'Chế độ Tiêu chuẩn (Standard Clinical UI)',
    'Giao diện cân bằng cho thực hành CBT / DBT hàng ngày',
  ),
  lowEnergyDepression(
    'low_energy_depression',
    'Chế độ Tinh gọn Cho Ngày Mệt mỏi (Low-Energy Mode: <= -3)',
    'Thu gọn về "1 Bước Nhỏ Tiếp Theo" • Không đếm chuỗi ngày đứt (No Broken Streaks)',
  ),
  lowStimulusManiaDarkRest(
    'low_stimulus_mania',
    'Lá chắn Hạ nhiệt Hưng cảm (Low-Stimulus Dark Rest: >= +2)',
    'Tông màu Hổ phách trầm ấm • Tắt toàn bộ hiệu ứng động • Bật Khoang Chờ 48 Giờ',
  );

  final String code;
  final String titleVi;
  final String subtitleVi;
  const ClinicalThemeMode(this.code, this.titleVi, this.subtitleVi);
}

class AdaptiveClinicalTheme {
  const AdaptiveClinicalTheme._();

  /// Resolves the appropriate clinical UI theme from current mood polarity and ASRM score.
  static ClinicalThemeMode resolveThemeMode({
    required int moodPolarity,
    int latestAsrmScore = 0,
    int lowStimulusThreshold = 2,
    ClinicalThemeMode? manualOverride,
  }) {
    if (manualOverride != null) return manualOverride;
    if (moodPolarity >= lowStimulusThreshold || latestAsrmScore >= 6) {
      return ClinicalThemeMode.lowStimulusManiaDarkRest;
    }
    if (moodPolarity <= -3) {
      return ClinicalThemeMode.lowEnergyDepression;
    }
    return ClinicalThemeMode.standard;
  }

  static ThemeData buildThemeData(ClinicalThemeMode mode) {
    switch (mode) {
      case ClinicalThemeMode.standard:
        return _buildStandardTheme();
      case ClinicalThemeMode.lowEnergyDepression:
        return _buildLowEnergyDepressionTheme();
      case ClinicalThemeMode.lowStimulusManiaDarkRest:
        return _buildLowStimulusManiaTheme();
    }
  }

  static ThemeData _buildStandardTheme() {
    const primarySage = Color(0xFF2C6E63);
    const surfaceBg = Color(0xFFF6F8F7);
    final scheme = ColorScheme.fromSeed(
      seedColor: primarySage,
      brightness: Brightness.light,
      primary: primarySage,
      secondary: const Color(0xFF4A7C59),
      tertiary: const Color(0xFFB85D19),
      surface: surfaceBg,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      scaffoldBackgroundColor: surfaceBg,
      cardTheme: CardTheme(
        elevation: 0,
        color: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: Color(0xFFE0E7E4)),
        ),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.white,
        foregroundColor: Color(0xFF1C2D2A),
        elevation: 0,
        centerTitle: false,
      ),
    );
  }

  static ThemeData _buildLowEnergyDepressionTheme() {
    // Soft, gentle, spacious palette with larger touch targets and zero visual noise
    const soothingTeal = Color(0xFF356872);
    const warmCream = Color(0xFFFAF7F2);
    final scheme = ColorScheme.fromSeed(
      seedColor: soothingTeal,
      brightness: Brightness.light,
      primary: soothingTeal,
      secondary: const Color(0xFF5D7A68),
      surface: warmCream,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      scaffoldBackgroundColor: warmCream,
      cardTheme: CardTheme(
        elevation: 0,
        color: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: Color(0xFFE6E0D6), width: 1.2),
        ),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: warmCream,
        foregroundColor: Color(0xFF253538),
        elevation: 0,
      ),
    );
  }

  static ThemeData _buildLowStimulusManiaTheme() {
    // Dark Rest / Low-Stimulus Mode:
    // - Warm dark sepia/amber background (#14110E)
    // - Muted amber text/controls (#D8A657) — eliminates blue light wavelength
    // - NoSplash.splashFactory and zero page transition animations
    const darkRestBg = Color(0xFF14110E);
    const darkRestCard = Color(0xFF1F1A15);
    const warmAmber = Color(0xFFD8A657);
    const softSand = Color(0xFFE5D5BE);

    final scheme = ColorScheme.fromSeed(
      seedColor: warmAmber,
      brightness: Brightness.dark,
      primary: warmAmber,
      onPrimary: const Color(0xFF1A140C),
      secondary: const Color(0xFFB5894A),
      surface: darkRestCard,
      onSurface: softSand,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      scaffoldBackgroundColor: darkRestBg,
      splashFactory: NoSplash.splashFactory,
      highlightColor: Colors.transparent,
      hoverColor: Colors.transparent,
      pageTransitionsTheme: const PageTransitionsTheme(
        builders: {
          TargetPlatform.android: _ZeroAnimationPageTransitionsBuilder(),
          TargetPlatform.iOS: _ZeroAnimationPageTransitionsBuilder(),
          TargetPlatform.windows: _ZeroAnimationPageTransitionsBuilder(),
          TargetPlatform.macOS: _ZeroAnimationPageTransitionsBuilder(),
          TargetPlatform.linux: _ZeroAnimationPageTransitionsBuilder(),
        },
      ),
      cardTheme: CardTheme(
        elevation: 0,
        color: darkRestCard,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(14),
          side: const BorderSide(color: Color(0xFF3A2F23)),
        ),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: darkRestBg,
        foregroundColor: softSand,
        elevation: 0,
      ),
    );
  }
}

class _ZeroAnimationPageTransitionsBuilder extends PageTransitionsBuilder {
  const _ZeroAnimationPageTransitionsBuilder();

  @override
  Widget buildTransitions<T>(
    PageRoute<T> route,
    BuildContext context,
    Animation<double> animation,
    Animation<double> secondaryAnimation,
    Widget child,
  ) {
    return child;
  }
}
