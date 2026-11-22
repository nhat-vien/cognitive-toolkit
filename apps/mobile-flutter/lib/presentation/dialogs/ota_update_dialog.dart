// lib/presentation/dialogs/ota_update_dialog.dart
// Sanctuary-styled Over-The-Air (OTA) update modal dialog.
// Displays version comparison, clinical release notes, and direct APK download triggers.

import 'package:flutter/material.dart';

import '../../domain/services/ota_update_service.dart';

class OtaUpdateDialog extends StatefulWidget {
  final OtaCheckResult checkResult;

  const OtaUpdateDialog({
    super.key,
    required this.checkResult,
  });

  /// Displays the OTA update dialog modally.
  static Future<void> show(BuildContext context, OtaCheckResult result) {
    return showDialog(
      context: context,
      barrierDismissible: true,
      builder: (_) => OtaUpdateDialog(checkResult: result),
    );
  }

  @override
  State<OtaUpdateDialog> createState() => _OtaUpdateDialogState();
}

class _OtaUpdateDialogState extends State<OtaUpdateDialog> {
  bool _isDownloading = false;

  Future<void> _handleDownload(String url) async {
    final messenger = ScaffoldMessenger.of(context);
    final navigator = Navigator.of(context);
    setState(() => _isDownloading = true);
    final ok = await OtaUpdateService.launchApkDownload(url);
    if (!mounted) return;
    setState(() => _isDownloading = false);

    if (ok) {
      messenger.showSnackBar(
        const SnackBar(
          content: Text(
            'Đang mở liên kết tải file APK cập nhật...',
            style: TextStyle(fontWeight: FontWeight.w600),
          ),
          backgroundColor: Color(0xFF2F4A3B),
        ),
      );
      navigator.pop();
    } else {
      messenger.showSnackBar(
        const SnackBar(
          content: Text('Không thể mở liên kết tải APK.'),
          backgroundColor: Colors.redAccent,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final release = widget.checkResult.latestRelease;
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;

    if (release == null) {
      return AlertDialog(
        title: const Text('Cập nhật Haven'),
        content: Text(widget.checkResult.message),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Đóng'),
          ),
        ],
      );
    }

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      backgroundColor: const Color(0xFFFAF9F6),
      child: Padding(
        padding: const EdgeInsets.all(22),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top Row: App Icon + Update Title
            Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: const Color(0xFF2F4A3B).withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(
                    Icons.system_update,
                    color: Color(0xFF2F4A3B),
                    size: 24,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Cập nhật Ứng dụng Haven',
                        style: TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF2F2F2B),
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Over-The-Air (OTA) Release',
                        style: TextStyle(
                          fontSize: 12,
                          color: scheme.onSurface.withValues(alpha: 0.65),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),

            const SizedBox(height: 14),

            // Version Transition Badge
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: const Color(0xFFEFF3EE),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFDCE4DB)),
              ),
              child: Row(
                children: [
                  const Icon(
                    Icons.auto_awesome,
                    size: 16,
                    color: Color(0xFF2F4A3B),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      widget.checkResult.formattedVersionDiff,
                      style: const TextStyle(
                        fontSize: 12.5,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF2F4A3B),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 14),

            const Text(
              'Điểm mới & Cải tiến trong bản này:',
              style: TextStyle(
                fontWeight: FontWeight.w700,
                fontSize: 13.5,
                color: Color(0xFF2F2F2B),
              ),
            ),
            const SizedBox(height: 6),

            // Scrollable Release Notes
            ConstrainedBox(
              constraints: const BoxConstraints(maxHeight: 180),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFE6E4DC)),
                ),
                child: SingleChildScrollView(
                  child: Text(
                    release.releaseNotesVi,
                    style: const TextStyle(
                      fontSize: 12.5,
                      height: 1.5,
                      color: Color(0xFF3C3C37),
                    ),
                  ),
                ),
              ),
            ),

            const SizedBox(height: 18),

            // Action Buttons
            Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                FilledButton.icon(
                  style: FilledButton.styleFrom(
                    backgroundColor: const Color(0xFF2F4A3B),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  onPressed: _isDownloading
                      ? null
                      : () => _handleDownload(release.apkUniversalUrl),
                  icon: _isDownloading
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Icon(Icons.download, size: 18),
                  label: const Text(
                    'Tải bản APK Universal (Phổ biến)',
                    style: TextStyle(fontWeight: FontWeight.w700),
                  ),
                ),
                const SizedBox(height: 8),
                if (release.apkArm64Url != null)
                  OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                    onPressed: _isDownloading
                        ? null
                        : () => _handleDownload(release.apkArm64Url!),
                    icon: const Icon(Icons.bolt, size: 16),
                    label: const Text(
                      'Tải bản APK Arm64 (Gọn nhẹ cho máy mới)',
                      style: TextStyle(fontSize: 12.5),
                    ),
                  ),
                const SizedBox(height: 6),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    TextButton(
                      onPressed: () =>
                          OtaUpdateService.launchApkDownload(release.htmlUrl),
                      child: const Text(
                        'Xem trên GitHub Releases',
                        style: TextStyle(fontSize: 12),
                      ),
                    ),
                    TextButton(
                      onPressed: () => Navigator.of(context).pop(),
                      child: const Text(
                        'Để sau',
                        style: TextStyle(fontSize: 12, color: Colors.grey),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
