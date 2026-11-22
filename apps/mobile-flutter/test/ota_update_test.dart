// test/ota_update_test.dart
// Unit tests for Haven Over-The-Air (OTA) update service and release info parser.

import 'package:equilibria_mobile_flutter/domain/services/ota_update_service.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('1. Semver and Build Number Comparison', () {
    test('compareSemver accurately ranks version strings', () {
      expect(OtaUpdateService.compareSemver('1.0.1', '1.0.0'), greaterThan(0));
      expect(OtaUpdateService.compareSemver('1.1.0', '1.0.9'), greaterThan(0));
      expect(OtaUpdateService.compareSemver('2.0.0', '1.9.9'), greaterThan(0));
      expect(OtaUpdateService.compareSemver('1.0.0', '1.0.0'), equals(0));
      expect(OtaUpdateService.compareSemver('1.0.0', '1.0.1'), lessThan(0));
      expect(OtaUpdateService.compareSemver('v1.0.2', '1.0.1'), greaterThan(0));
    });

    test('isUpdateAvailable flags newer build numbers', () {
      // Remote build is higher
      expect(
        OtaUpdateService.isUpdateAvailable(
          currentVersion: '1.0.1',
          currentBuildNumber: 2,
          remoteVersion: '1.0.1',
          remoteBuildNumber: 3,
        ),
        isTrue,
      );

      // Remote build is same and semver same
      expect(
        OtaUpdateService.isUpdateAvailable(
          currentVersion: '1.0.1',
          currentBuildNumber: 2,
          remoteVersion: '1.0.1',
          remoteBuildNumber: 2,
        ),
        isFalse,
      );

      // Remote build is lower
      expect(
        OtaUpdateService.isUpdateAvailable(
          currentVersion: '1.0.1',
          currentBuildNumber: 3,
          remoteVersion: '1.0.1',
          remoteBuildNumber: 2,
        ),
        isFalse,
      );

      // Newer semver even if build numbers are 0
      expect(
        OtaUpdateService.isUpdateAvailable(
          currentVersion: '1.0.0',
          currentBuildNumber: 0,
          remoteVersion: '1.0.1',
          remoteBuildNumber: 0,
        ),
        isTrue,
      );
    });
  });

  group('2. Release Manifest JSON Parsing', () {
    test('HavenOtaReleaseInfo.fromJson parses custom OTA manifest', () {
      final json = {
        'version': '1.0.2',
        'buildNumber': 4,
        'releaseName': 'Haven Sprint 5 Release',
        'releaseNotesVi': 'Bản vá lỗi bẻ gãy chữ và bổ sung tính năng OTA.',
        'publishedAt': '2026-11-22T08:00:00Z',
        'apkUniversalUrl': 'https://example.com/haven-universal.apk',
        'apkArm64Url': 'https://example.com/haven-arm64.apk',
        'htmlUrl': 'https://github.com/nhat-vien/cognitive-toolkit/releases',
        'apkUniversalSizeBytes': 52428800,
      };

      final info = HavenOtaReleaseInfo.fromJson(json);

      expect(info.version, equals('1.0.2'));
      expect(info.buildNumber, equals(4));
      expect(info.releaseName, equals('Haven Sprint 5 Release'));
      expect(info.releaseNotesVi, contains('bẻ gãy chữ'));
      expect(info.apkUniversalUrl, equals('https://example.com/haven-universal.apk'));
      expect(info.apkArm64Url, equals('https://example.com/haven-arm64.apk'));
      expect(info.apkUniversalSizeBytes, equals(52428800));
    });

    test('HavenOtaReleaseInfo.fromGitHubReleaseJson extracts matching APK assets', () {
      final ghJson = {
        'tag_name': 'mobile-latest',
        'name': 'Haven — Nơi Bình Yên (mobile-latest)',
        'body': 'Bản phát hành ứng dụng di động Haven APK & IPA.',
        'published_at': '2026-11-22T08:30:00Z',
        'html_url': 'https://github.com/nhat-vien/cognitive-toolkit/releases/tag/mobile-latest',
        'assets': [
          {
            'name': 'haven-android-arm64-v8a.apk',
            'browser_download_url': 'https://github.com/.../haven-android-arm64-v8a.apk',
            'size': 20000000,
          },
          {
            'name': 'haven-android-universal.apk',
            'browser_download_url': 'https://github.com/.../haven-android-universal.apk',
            'size': 55000000,
          },
          {
            'name': 'haven-ios-unsigned.ipa',
            'browser_download_url': 'https://github.com/.../haven-ios-unsigned.ipa',
            'size': 8000000,
          },
        ],
      };

      final info = HavenOtaReleaseInfo.fromGitHubReleaseJson(ghJson);

      expect(info.releaseName, contains('Haven'));
      expect(info.apkUniversalUrl, contains('haven-android-universal.apk'));
      expect(info.apkArm64Url, contains('haven-android-arm64-v8a.apk'));
      expect(info.apkUniversalSizeBytes, equals(55000000));
    });

    test('OtaCheckResult formats version transition text cleanly', () {
      const release = HavenOtaReleaseInfo(
        version: '1.0.2',
        buildNumber: 4,
        releaseName: 'Test',
        releaseNotesVi: 'Notes',
        apkUniversalUrl: 'https://example.com',
        htmlUrl: 'https://example.com',
      );

      const result = OtaCheckResult(
        hasUpdate: true,
        latestRelease: release,
        currentVersion: '1.0.1',
        currentBuildNumber: 2,
        message: 'Update found',
      );

      expect(result.formattedVersionDiff, equals('v1.0.1 (Build 2) → v1.0.2 (Build 4)'));
    });
  });
}
