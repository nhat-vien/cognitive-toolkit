// lib/presentation/theme/adaptive_clinical_theme.dart
// Dynamic Clinical Theme Engine (Synchronized with Haven Serene Sanctuary Palette):
// 1. Standard Haven Sanctuary Mode: Warm Alabaster Paper (#FAF9F6), Lavender-Slate (#797298),
//    Healing Sage (#6AA882), Soft Charcoal (#2F2F2B).
// 2. Low-Energy Depression Mode (Polarity <= -3):
//    Soft Warm Oatmeal (#F4F1EA), extra-gentle rounded surfaces, collapses dashboard clutter
//    into "One Small Step", strictly hides broken streaks.
// 3. Low-Stimulus Mania Dark Rest Mode (Polarity >= +2 or ASRM >= 6):
//    Deep Warm Obsidian-Amber (#14110F), Muted Amber (#D97706), zero blue light,
//    NoSplash.splashFactory and zero page transition animations.

import 'package:flutter/material.dart';

enum ClinicalThemeMode {
  standard(
    'standard',
    'Haven — Không gian Bình yên',
    'Lắng nghe & chăm sóc tâm trí mỗi ngày',
  ),
  lowEnergyDepression(
    'low_energy_depression',
    'Không gian Dịu dàng',
    'Hôm nay một bước nhỏ thôi là đủ • Không đếm chuỗi ngày đứt',
  ),
  lowStimulusManiaDarkRest(
    'low_stimulus_mania',
    'Không gian Trầm ấm Hạ nhiệt',
    'Ánh sáng hổ phách dịu mắt • Tắt hiệu ứng động • Bảo vệ giấc ngủ',
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
    // V2 Official Design Tokens (UI_UX_V2_DESIGN_SPEC.md)
    const v2PrimarySage = Color(0xFF426B57);
    const v2PrimaryContainer = Color(0xFFDFEBE1);
    const v2Emergency = Color(0xFFA34C48);
    const v2Background = Color(0xFFF7F6F2);
    const v2Text = Color(0xFF263B33);

    final scheme = ColorScheme.fromSeed(
      seedColor: v2PrimarySage,
      brightness: Brightness.light,
      primary: v2PrimarySage,
      onPrimary: Colors.white,
      primaryContainer: v2PrimaryContainer,
      secondary: v2PrimarySage,
      tertiary: v2Emergency,
      surface: v2Background,
      onSurface: v2Text,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      scaffoldBackgroundColor: v2Background,
      cardTheme: CardThemeData(
        elevation: 0,
        color: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: Color(0xFFDCE5DF)),
        ),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: v2Background,
        foregroundColor: v2Text,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: Colors.white,
        indicatorColor: v2PrimaryContainer,
        labelTextStyle: WidgetStateProperty.resolveWith(
          (states) => TextStyle(
            fontSize: 12,
            fontWeight: states.contains(WidgetState.selected)
                ? FontWeight.w700
                : FontWeight.w500,
            color: states.contains(WidgetState.selected)
                ? v2PrimarySage
                : const Color(0xFF4A6157),
          ),
        ),
      ),
    );
  }

  static ThemeData _buildLowEnergyDepressionTheme() {
    const primaryLavender = Color(0xFF797298);
    const healingSage = Color(0xFF6AA882);
    const warmOatmealBg = Color(0xFFF4F1EA);
    const warmCreamSurface = Color(0xFFFAF8F5);
    const softCharcoal = Color(0xFF2F2F2B);

    final scheme = ColorScheme.fromSeed(
      seedColor: primaryLavender,
      brightness: Brightness.light,
      primary: primaryLavender,
      onPrimary: Colors.white,
      secondary: healingSage,
      tertiary: const Color(0xFFC56548),
      surface: warmCreamSurface,
      onSurface: softCharcoal,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      scaffoldBackgroundColor: warmOatmealBg,
      cardTheme: CardThemeData(
        elevation: 0,
        color: warmCreamSurface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: Color(0xFFE4E0D5), width: 1.2),
        ),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: warmOatmealBg,
        foregroundColor: softCharcoal,
        elevation: 0,
        scrolledUnderElevation: 0,
      ),
    );
  }

  static ThemeData _buildLowStimulusManiaTheme() {
    const obsidianBg = Color(0xFF14110F);
    const warmDarkCard = Color(0xFF1E1916);
    const warmAmber = Color(0xFFD97706);
    const softAmber = Color(0xFFF59E0B);
    const warmSand = Color(0xFFFAF3E0);

    final scheme = ColorScheme.fromSeed(
      seedColor: warmAmber,
      brightness: Brightness.dark,
      primary: warmAmber,
      onPrimary: const Color(0xFF14110F),
      secondary: softAmber,
      tertiary: const Color(0xFFC56548),
      surface: warmDarkCard,
      onSurface: warmSand,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      scaffoldBackgroundColor: obsidianBg,
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
      cardTheme: CardThemeData(
        elevation: 0,
        color: warmDarkCard,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(14),
          side: const BorderSide(color: Color(0xFF38302A)),
        ),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: obsidianBg,
        foregroundColor: warmSand,
        elevation: 0,
        scrolledUnderElevation: 0,
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
