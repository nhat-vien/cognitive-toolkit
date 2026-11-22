// lib/domain/services/ota_update_service.dart
// Over-The-Air (OTA) Update Service for Haven Mobile App.
// Checks GitHub Releases and raw manifest for updates, compares semantic
// versions & build numbers, and triggers direct APK downloads/installs.

import 'dart:convert';
import 'dart:io';

import 'package:url_launcher/url_launcher.dart';

const String kCurrentHavenAppVersion = '1.0.1';
const int kCurrentHavenBuildNumber = 2;

const String kHavenManifestRawUrl =
    'https://raw.githubusercontent.com/nhat-vien/cognitive-toolkit/main/apps/mobile-flutter/ota-version.json';

const String kHavenReleasesApiUrl =
    'https://api.github.com/repos/nhat-vien/cognitive-toolkit/releases/tags/mobile-latest';

const String kHavenDefaultUniversalApkUrl =
    'https://github.com/nhat-vien/cognitive-toolkit/releases/download/mobile-latest/haven-android-universal.apk';

const String kHavenDefaultArm64ApkUrl =
    'https://github.com/nhat-vien/cognitive-toolkit/releases/download/mobile-latest/haven-android-arm64-v8a.apk';

const String kHavenReleasePageUrl =
    'https://github.com/nhat-vien/cognitive-toolkit/releases/tag/mobile-latest';

/// Represents parsed remote release metadata.
class HavenOtaReleaseInfo {
  final String version;
  final int buildNumber;
  final String releaseName;
  final String releaseNotesVi;
  final String? publishedAtIso;
  final String apkUniversalUrl;
  final String? apkArm64Url;
  final String htmlUrl;
  final int apkUniversalSizeBytes;

  const HavenOtaReleaseInfo({
    required this.version,
    required this.buildNumber,
    required this.releaseName,
    required this.releaseNotesVi,
    this.publishedAtIso,
    required this.apkUniversalUrl,
    this.apkArm64Url,
    required this.htmlUrl,
    this.apkUniversalSizeBytes = 0,
  });

  factory HavenOtaReleaseInfo.fromJson(Map<String, dynamic> json) {
    return HavenOtaReleaseInfo(
      version: (json['version'] as String?) ?? '1.0.0',
      buildNumber: (json['buildNumber'] as num?)?.toInt() ?? 1,
      releaseName: (json['releaseName'] as String?) ?? 'Haven Update',
      releaseNotesVi: (json['releaseNotesVi'] as String?) ??
          'Bản cập nhật Haven mới nhất với các cải tiến về tính ổn định và giao diện.',
      publishedAtIso: json['publishedAt'] as String?,
      apkUniversalUrl: (json['apkUniversalUrl'] as String?) ??
          kHavenDefaultUniversalApkUrl,
      apkArm64Url: json['apkArm64Url'] as String? ?? kHavenDefaultArm64ApkUrl,
      htmlUrl: (json['htmlUrl'] as String?) ?? kHavenReleasePageUrl,
      apkUniversalSizeBytes:
          (json['apkUniversalSizeBytes'] as num?)?.toInt() ?? 0,
    );
  }

  factory HavenOtaReleaseInfo.fromGitHubReleaseJson(Map<String, dynamic> json) {
    final assets = (json['assets'] as List<dynamic>?) ?? [];
    String universalUrl = kHavenDefaultUniversalApkUrl;
    String? arm64Url = kHavenDefaultArm64ApkUrl;
    int universalSize = 0;

    for (final raw in assets) {
      if (raw is Map<String, dynamic>) {
        final name = (raw['name'] as String?) ?? '';
        final downloadUrl = (raw['browser_download_url'] as String?) ?? '';
        final size = (raw['size'] as num?)?.toInt() ?? 0;
        if (name.contains('universal') && name.endsWith('.apk')) {
          universalUrl = downloadUrl;
          universalSize = size;
        } else if (name.contains('arm64') && name.endsWith('.apk')) {
          arm64Url = downloadUrl;
        }
      }
    }

    final tagName = (json['tag_name'] as String?) ?? 'mobile-latest';
    final rawBody = (json['body'] as String?) ?? '';

    return HavenOtaReleaseInfo(
      version: tagName.replaceAll('mobile-v', '').replaceAll('v', ''),
      buildNumber: 3,
      releaseName: (json['name'] as String?) ?? 'Haven ($tagName)',
      releaseNotesVi: rawBody.isNotEmpty
          ? rawBody
          : 'Bản cập nhật Haven mới nhất từ GitHub Releases.',
      publishedAtIso: json['published_at'] as String?,
      apkUniversalUrl: universalUrl,
      apkArm64Url: arm64Url,
      htmlUrl: (json['html_url'] as String?) ?? kHavenReleasePageUrl,
      apkUniversalSizeBytes: universalSize,
    );
  }
}

/// Result of an OTA update check.
class OtaCheckResult {
  final bool hasUpdate;
  final HavenOtaReleaseInfo? latestRelease;
  final String currentVersion;
  final int currentBuildNumber;
  final String message;
  final bool isError;

  const OtaCheckResult({
    required this.hasUpdate,
    this.latestRelease,
    required this.currentVersion,
    required this.currentBuildNumber,
    required this.message,
    this.isError = false,
  });

  String get formattedVersionDiff {
    if (latestRelease == null) return 'v$currentVersion';
    return 'v$currentVersion (Build $currentBuildNumber) → v${latestRelease!.version} (Build ${latestRelease!.buildNumber})';
  }
}

/// Service that coordinates OTA update discovery and execution.
class OtaUpdateService {
  final String localVersion;
  final int localBuildNumber;
  final String manifestUrl;
  final String releasesApiUrl;

  const OtaUpdateService({
    this.localVersion = kCurrentHavenAppVersion,
    this.localBuildNumber = kCurrentHavenBuildNumber,
    this.manifestUrl = kHavenManifestRawUrl,
    this.releasesApiUrl = kHavenReleasesApiUrl,
  });

  /// Compares local and remote version / build numbers.
  static bool isUpdateAvailable({
    required String currentVersion,
    required int currentBuildNumber,
    required String remoteVersion,
    required int remoteBuildNumber,
  }) {
    if (remoteBuildNumber > 0 && currentBuildNumber > 0) {
      if (remoteBuildNumber > currentBuildNumber) return true;
      if (remoteBuildNumber < currentBuildNumber) return false;
    }
    return compareSemver(remoteVersion, currentVersion) > 0;
  }

  /// Compares two semver strings like "1.0.1" and "1.0.0".
  static int compareSemver(String a, String b) {
    final cleanA = a.replaceAll(RegExp(r'[^0-9.]'), '');
    final cleanB = b.replaceAll(RegExp(r'[^0-9.]'), '');
    final partsA = cleanA.split('.').map((e) => int.tryParse(e) ?? 0).toList();
    final partsB = cleanB.split('.').map((e) => int.tryParse(e) ?? 0).toList();
    final maxLen = partsA.length > partsB.length ? partsA.length : partsB.length;
    for (int i = 0; i < maxLen; i++) {
      final vA = i < partsA.length ? partsA[i] : 0;
      final vB = i < partsB.length ? partsB[i] : 0;
      if (vA != vB) return vA.compareTo(vB);
    }
    return 0;
  }

  /// Checks for updates over-the-air.
  /// First queries the fast raw manifest; falls back to GitHub Releases API.
  Future<OtaCheckResult> checkForUpdates({HttpClient? customClient}) async {
    final client = customClient ?? HttpClient()
      ..connectionTimeout = const Duration(seconds: 8);

    try {
      // 1. Try raw JSON manifest (no GitHub rate limits)
      final manifestInfo = await _fetchFromUrl(
        client,
        manifestUrl,
        (json) => HavenOtaReleaseInfo.fromJson(json),
      );

      if (manifestInfo != null) {
        final needsUpdate = isUpdateAvailable(
          currentVersion: localVersion,
          currentBuildNumber: localBuildNumber,
          remoteVersion: manifestInfo.version,
          remoteBuildNumber: manifestInfo.buildNumber,
        );

        return OtaCheckResult(
          hasUpdate: needsUpdate,
          latestRelease: manifestInfo,
          currentVersion: localVersion,
          currentBuildNumber: localBuildNumber,
          message: needsUpdate
              ? 'Đã có bản cập nhật mới (v${manifestInfo.version} Build ${manifestInfo.buildNumber}).'
              : 'Haven đang ở phiên bản mới nhất.',
        );
      }

      // 2. Fallback to GitHub Releases API
      final releaseInfo = await _fetchFromUrl(
        client,
        releasesApiUrl,
        (json) => HavenOtaReleaseInfo.fromGitHubReleaseJson(json),
      );

      if (releaseInfo != null) {
        final needsUpdate = isUpdateAvailable(
          currentVersion: localVersion,
          currentBuildNumber: localBuildNumber,
          remoteVersion: releaseInfo.version,
          remoteBuildNumber: releaseInfo.buildNumber,
        );

        return OtaCheckResult(
          hasUpdate: needsUpdate,
          latestRelease: releaseInfo,
          currentVersion: localVersion,
          currentBuildNumber: localBuildNumber,
          message: needsUpdate
              ? 'Đã có bản cập nhật mới trên GitHub Releases.'
              : 'Haven đang ở phiên bản mới nhất.',
        );
      }

      return OtaCheckResult(
        hasUpdate: false,
        currentVersion: localVersion,
        currentBuildNumber: localBuildNumber,
        message: 'Không thể kết nối đến máy chủ cập nhật lúc này.',
        isError: true,
      );
    } catch (e) {
      return OtaCheckResult(
        hasUpdate: false,
        currentVersion: localVersion,
        currentBuildNumber: localBuildNumber,
        message: 'Lỗi kiểm tra cập nhật: $e',
        isError: true,
      );
    } finally {
      if (customClient == null) {
        client.close();
      }
    }
  }

  Future<HavenOtaReleaseInfo?> _fetchFromUrl(
    HttpClient client,
    String targetUrl,
    HavenOtaReleaseInfo Function(Map<String, dynamic>) parser,
  ) async {
    try {
      final req = await client.getUrl(Uri.parse(targetUrl));
      req.headers.set('User-Agent', 'Haven-Mobile-App-OTA');
      req.headers.set('Accept', 'application/json');
      final res = await req.close();
      if (res.statusCode >= 200 && res.statusCode < 300) {
        final bodyStr = await res.transform(utf8.decoder).join();
        final dynamic decoded = jsonDecode(bodyStr);
        if (decoded is Map<String, dynamic>) {
          return parser(decoded);
        }
      }
    } catch (_) {
      // Fallback quietly
    }
    return null;
  }

  /// Opens the APK download link in external browser or system package installer.
  static Future<bool> launchApkDownload(String apkUrl) async {
    final uri = Uri.parse(apkUrl);
    if (await canLaunchUrl(uri)) {
      return launchUrl(uri, mode: LaunchMode.externalApplication);
    }
    return false;
  }
}
