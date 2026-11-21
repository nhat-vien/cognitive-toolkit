# Haven — Nơi Bình Yên (Equilibria Mobile App • Android & iOS)

> **Ứng dụng Đồng hành Chăm sóc Sức khỏe Tâm trí Dựa trên Bằng chứng Khoa học (CBT, TEAM-CBT, DBT & IPSRT)**  
> Mã định danh: `com.haven.equilibria` • Hoạt động 100% ngoại tuyến • Bảo vệ dữ liệu riêng tư bằng phần cứng (Android Keystore / iOS Keychain)

---

## 1. Tính năng Nổi bật trên Mobile

1. **Cổng Bình Tĩnh 1-Chạm (SOS Portal — Luôn sẵn sàng không cần đăng nhập)**:
   - Giao thức **DBT `TIPP`**: Sàng lọc y khoa tim mạch bắt buộc trước nước lạnh (`Temperature`), đồng hồ nhịp thở xúc giác rung nhắm mắt **4-6 / 4-7-8** (`Paced Breathing`), thư giãn cơ (`PMR`), neo giác quan **`5-4-3-2-1`**, và kỹ năng **`STOP`**.
   - Nút **gọi khẩn cấp 1 chạm** tới Cấp cứu Y tế `115`, Đường dây nóng `096 306 1414`, Tổng đài `111`.
2. **Không gian Đón chào Dịu dàng & 5 Tab Thân thiện**:
   - **Trang chủ**: Lời chào cá nhân hóa, nút chuyển nhanh tâm trạng (*Trầm mệt / Cân bằng / Hạ nhiệt*), giao diện tự co giãn giảm áp lực (**Low-Energy Mode**: *"Một bước nhỏ"* & **No Broken Streaks**; **Low-Stimulus Dark Rest** cho pha hưng cảm), và Check-in 4 trục độc lập.
   - **Thực hành**: Tâm sự Voice Burst & 7 bài tập hướng dẫn có cổng an toàn (*Accuracy Check*, *Rest Check*, *Justified Check*, *Harsh Self-Critic Guard*, *Chain Analysis Hard Stops*, *DEAR MAN*), Chiếc hộp gác lại âu lo (*Worry Box*), Thang bước nhỏ vượt sợ hãi & Kho 36 công cụ.
   - **Khí sắc**: Biểu đồ hai cực `-5..+5`, 5 mốc nhịp sinh học IPSRT, Khoang chờ quyết định 48 giờ (*48h Impulse Vault*) & Giao ước Ulysses.
   - **Trợ lý AI & Sinh trắc**: Chat RAG có ngưỡng từ chối `0.46`, Voice Burst WPM phát hiện nói nhanh hưng cảm, kết nối tùy chọn **Health Connect (Android) / HealthKit (iOS)** tính HRV theo đường nền cá nhân 14–30 ngày.
   - **Tự kiểm tra & Bác sĩ**: Bộ **6 bảng câu hỏi trắc nghiệm tương tác** (**BMS, PHQ-9, GAD-7, ISI, ASRM, MDQ**) chấm điểm thực tế kèm cảnh báo an toàn tự động, xuất báo cáo PDF A4 & liên kết Zero-Knowledge `#key=...`.

---

## 2. Tải Cài Đặt Qua Cloud CI/CD (GitHub Releases)

Mỗi khi push mã nguồn lên nhánh `main` (hoặc tag `mobile-v*`), workflow [`.github/workflows/mobile-flutter-ci.yml`](../../.github/workflows/mobile-flutter-ci.yml) tự động chạy `flutter analyze`, `flutter test`, build và phát hành lên **GitHub Releases (`mobile-latest`)**:
- `haven-android-universal.apk` — Cài đặt trực tiếp trên mọi máy Android (Android 8.0 / API 26+).
- `haven-android-arm64-v8a.apk` — Bản gọn nhẹ cho điện thoại Android 64-bit.
- `haven-android-playstore.aab` — File App Bundle cho Google Play Console.
- `haven-ios-unsigned.ipa` — Bản IPA iOS (cài qua AltStore / Sideloadly hoặc ký lại bằng Apple Developer Certificate).

---

## 3. Tự Build Cục Bộ (Khi đã cài Flutter 3.29+)

```bash
cd apps/mobile-flutter
flutter create --platforms=android,ios --org com.haven --project-name equilibria_mobile_flutter .
python3 tool/configure_native_platforms.py --platform all
flutter pub get
dart run flutter_launcher_icons
flutter test
flutter build apk --release
```
