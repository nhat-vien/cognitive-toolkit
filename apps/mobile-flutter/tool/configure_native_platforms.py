#!/usr/bin/env python3
"""
Idempotent post-`flutter create` native platform configurator for Haven (`com.haven.equilibria`).
Usage:
  python3 tool/configure_native_platforms.py --platform android
  python3 tool/configure_native_platforms.py --platform ios
  python3 tool/configure_native_platforms.py --platform all
"""

import argparse
import os
import plistlib
import re
import shutil
import xml.etree.ElementTree as ET

APP_DISPLAY_NAME = "Haven"
PACKAGE_ID = "com.haven.equilibria"
ANDROID_NS = "http://schemas.android.com/apk/res/android"
TOOLS_NS = "http://schemas.android.com/tools"


def remove_default_widget_test(root_dir: str) -> None:
    widget_test = os.path.join(root_dir, "test", "widget_test.dart")
    if os.path.exists(widget_test):
        os.remove(widget_test)
        print("Removed default test/widget_test.dart")


def configure_android(root_dir: str) -> None:
    android_dir = os.path.join(root_dir, "android")
    if not os.path.isdir(android_dir):
        print("Warning: android/ directory not found, skipping Android config.")
        return

    # 0. Install deterministic Haven APK signing keystore to ~/.android/debug.keystore
    # so every CI build has the exact same certificate and OTA updates install in-place without package signature conflict!
    permanent_ks = os.path.join(root_dir, "tool", "haven-release-debug.keystore")
    if os.path.exists(permanent_ks):
        user_android_dir = os.path.expanduser("~/.android")
        os.makedirs(user_android_dir, exist_ok=True)
        target_debug_ks = os.path.join(user_android_dir, "debug.keystore")
        shutil.copyfile(permanent_ks, target_debug_ks)
        print("Installed permanent deterministic signing key to", target_debug_ks)

    # 1. Patch gradle.properties
    gradle_props = os.path.join(android_dir, "gradle.properties")
    if os.path.exists(gradle_props):
        with open(gradle_props, "r", encoding="utf-8") as f:
            content = f.read()
        if re.search(r"^org\.gradle\.jvmargs=.*$", content, flags=re.MULTILINE):
            content = re.sub(
                r"^org\.gradle\.jvmargs=.*$",
                "org.gradle.jvmargs=-Xmx4G -XX:MaxMetaspaceSize=1G",
                content,
                flags=re.MULTILINE,
            )
        else:
            content += "\norg.gradle.jvmargs=-Xmx4G -XX:MaxMetaspaceSize=1G\n"
        with open(gradle_props, "w", encoding="utf-8") as f:
            f.write(content)

    # 2. Patch app/build.gradle.kts or app/build.gradle
    kts_path = os.path.join(android_dir, "app", "build.gradle.kts")
    groovy_path = os.path.join(android_dir, "app", "build.gradle")
    if os.path.exists(kts_path):
        with open(kts_path, "r", encoding="utf-8") as f:
            g = f.read()
        g = re.sub(r'namespace\s*=\s*"[^"]+"', f'namespace = "{PACKAGE_ID}"', g)
        g = re.sub(r'applicationId\s*=\s*"[^"]+"', f'applicationId = "{PACKAGE_ID}"', g)
        g = re.sub(r"compileSdk\s*=\s*[^\s\n]+", "compileSdk = 35", g)
        g = re.sub(r"minSdk\s*=\s*[^\s\n]+", "minSdk = 26", g)
        g = re.sub(r"targetSdk\s*=\s*[^\s\n]+", "targetSdk = 35", g)
        g = re.sub(r"JavaVersion\.VERSION_\d+", "JavaVersion.VERSION_17", g)
        g = re.sub(
            r"jvmTarget\s*=\s*JavaVersion\.VERSION_\d+\.toString\(\)",
            'jvmTarget = "17"',
            g,
        )
        g = re.sub(r'jvmTarget\s*=\s*"[0-9.]+"', 'jvmTarget = "17"', g)
        with open(kts_path, "w", encoding="utf-8") as f:
            f.write(g)
        print("Patched android/app/build.gradle.kts")
    elif os.path.exists(groovy_path):
        with open(groovy_path, "r", encoding="utf-8") as f:
            g = f.read()
        g = re.sub(r'namespace\s*=\s*"[^"]+"|namespace\s+"[^"]+"', f'namespace "{PACKAGE_ID}"', g)
        g = re.sub(r'applicationId\s+"[^"]+"', f'applicationId "{PACKAGE_ID}"', g)
        g = re.sub(r"compileSdk(?:Version)?\s*=?\s*[^\s\n]+", "compileSdk 35", g)
        g = re.sub(r"minSdk(?:Version)?\s*=?\s*[^\s\n]+", "minSdkVersion 26", g)
        g = re.sub(r"targetSdk(?:Version)?\s*=?\s*[^\s\n]+", "targetSdkVersion 35", g)
        g = re.sub(r"JavaVersion\.VERSION_\d+", "JavaVersion.VERSION_17", g)
        with open(groovy_path, "w", encoding="utf-8") as f:
            f.write(g)
        print("Patched android/app/build.gradle")

    # 3. Patch AndroidManifest.xml
    manifest_path = os.path.join(android_dir, "app", "src", "main", "AndroidManifest.xml")
    if os.path.exists(manifest_path):
        ET.register_namespace("android", ANDROID_NS)
        ET.register_namespace("tools", TOOLS_NS)
        tree = ET.parse(manifest_path)
        root = tree.getroot()

        required_perms = [
            "android.permission.INTERNET",
            "android.permission.VIBRATE",
            "android.permission.USE_BIOMETRIC",
            "android.permission.USE_FINGERPRINT",
            "android.permission.health.READ_HEART_RATE_VARIABILITY",
            "android.permission.health.READ_SLEEP",
        ]
        existing_perms = {
            el.get(f"{{{ANDROID_NS}}}name")
            for el in root.findall("uses-permission")
        }
        for perm in required_perms:
            if perm not in existing_perms:
                el = ET.Element("uses-permission", {f"{{{ANDROID_NS}}}name": perm})
                root.insert(0, el)

        # Ensure <queries> contains Health Connect package + tel/https schemes
        queries_el = root.find("queries")
        if queries_el is None:
            queries_el = ET.SubElement(root, "queries")

        existing_pkgs = {
            p.get(f"{{{ANDROID_NS}}}name")
            for p in queries_el.findall("package")
        }
        if "com.google.android.apps.healthdata" not in existing_pkgs:
            ET.SubElement(
                queries_el,
                "package",
                {f"{{{ANDROID_NS}}}name": "com.google.android.apps.healthdata"},
            )

        existing_intent_actions = set()
        for intent in queries_el.findall("intent"):
            act = intent.find("action")
            if act is not None:
                existing_intent_actions.add(act.get(f"{{{ANDROID_NS}}}name"))

        if "android.intent.action.DIAL" not in existing_intent_actions:
            intent_el = ET.SubElement(queries_el, "intent")
            ET.SubElement(
                intent_el,
                "action",
                {f"{{{ANDROID_NS}}}name": "android.intent.action.DIAL"},
            )
            ET.SubElement(intent_el, "data", {f"{{{ANDROID_NS}}}scheme": "tel"})

        if "android.intent.action.VIEW" not in existing_intent_actions:
            intent_el = ET.SubElement(queries_el, "intent")
            ET.SubElement(
                intent_el,
                "action",
                {f"{{{ANDROID_NS}}}name": "android.intent.action.VIEW"},
            )
            ET.SubElement(intent_el, "data", {f"{{{ANDROID_NS}}}scheme": "https"})

        app_el = root.find("application")
        if app_el is not None:
            app_el.set(f"{{{ANDROID_NS}}}label", APP_DISPLAY_NAME)
            main_act = app_el.find("activity")
            if main_act is not None:
                has_rationale = False
                for flt in main_act.findall("intent-filter"):
                    for act in flt.findall("action"):
                        if (
                            act.get(f"{{{ANDROID_NS}}}name")
                            == "androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE"
                        ):
                            has_rationale = True
                if not has_rationale:
                    flt = ET.SubElement(main_act, "intent-filter")
                    ET.SubElement(
                        flt,
                        "action",
                        {
                            f"{{{ANDROID_NS}}}name": "androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE"
                        },
                    )

        tree.write(manifest_path, encoding="utf-8", xml_declaration=True)
        print("Patched AndroidManifest.xml")

    # 4. Ensure MainActivity.kt extends FlutterFragmentActivity under com.haven.equilibria
    kotlin_root = os.path.join(android_dir, "app", "src", "main", "kotlin")
    if os.path.isdir(kotlin_root):
        shutil.rmtree(kotlin_root)
    target_kt_dir = os.path.join(kotlin_root, "com", "haven", "equilibria")
    os.makedirs(target_kt_dir, exist_ok=True)
    main_kt = os.path.join(target_kt_dir, "MainActivity.kt")
    with open(main_kt, "w", encoding="utf-8") as f:
        f.write(
            f"package {PACKAGE_ID}\n\n"
            "import io.flutter.embedding.android.FlutterFragmentActivity\n\n"
            "class MainActivity : FlutterFragmentActivity()\n"
        )
    print("Wrote FlutterFragmentActivity MainActivity.kt at", main_kt)


def configure_ios(root_dir: str) -> None:
    ios_dir = os.path.join(root_dir, "ios")
    if not os.path.isdir(ios_dir):
        print("Warning: ios/ directory not found, skipping iOS config.")
        return

    # 1. Patch Info.plist
    plist_path = os.path.join(ios_dir, "Runner", "Info.plist")
    if os.path.exists(plist_path):
        with open(plist_path, "rb") as f:
            plist = plistlib.load(f)
        plist["CFBundleDisplayName"] = APP_DISPLAY_NAME
        plist["CFBundleName"] = APP_DISPLAY_NAME
        plist["NSFaceIDUsageDescription"] = (
            "Haven sử dụng Face ID để bảo vệ nhật ký sức khỏe tâm trí mã hóa của bạn."
        )
        plist["NSHealthShareUsageDescription"] = (
            "Haven đọc chỉ số HRV và giấc ngủ (tùy chọn) để theo dõi nhịp sinh học cá nhân 14–30 ngày."
        )
        plist["NSMicrophoneUsageDescription"] = (
            "Haven sử dụng micro khi bạn chọn xả cảm xúc nhanh bằng giọng nói."
        )
        schemes = list(plist.get("LSApplicationQueriesSchemes", []))
        for s in ("tel", "https"):
            if s not in schemes:
                schemes.append(s)
        plist["LSApplicationQueriesSchemes"] = schemes

        with open(plist_path, "wb") as f:
            plistlib.dump(plist, f)
        print("Patched ios/Runner/Info.plist")

    # 2. Patch project.pbxproj Bundle ID and iOS deployment target
    pbx_path = os.path.join(ios_dir, "Runner.xcodeproj", "project.pbxproj")
    if os.path.exists(pbx_path):
        with open(pbx_path, "r", encoding="utf-8") as f:
            pbx = f.read()
        pbx = re.sub(
            r"PRODUCT_BUNDLE_IDENTIFIER\s*=\s*com\.haven\.equilibriaMobileFlutter\.RunnerTests;",
            f"PRODUCT_BUNDLE_IDENTIFIER = {PACKAGE_ID}.RunnerTests;",
            pbx,
        )
        pbx = re.sub(
            r"PRODUCT_BUNDLE_IDENTIFIER\s*=\s*com\.haven\.equilibriaMobileFlutter;",
            f"PRODUCT_BUNDLE_IDENTIFIER = {PACKAGE_ID};",
            pbx,
        )
        pbx = re.sub(
            r"IPHONEOS_DEPLOYMENT_TARGET\s*=\s*[0-9.]+;",
            "IPHONEOS_DEPLOYMENT_TARGET = 14.0;",
            pbx,
        )
        with open(pbx_path, "w", encoding="utf-8") as f:
            f.write(pbx)
        print("Patched ios/Runner.xcodeproj/project.pbxproj")

    # 3. Patch Podfile iOS platform target >= 14.0
    podfile_path = os.path.join(ios_dir, "Podfile")
    if os.path.exists(podfile_path):
        with open(podfile_path, "r", encoding="utf-8") as f:
            pod = f.read()
        if re.search(r"^\s*#?\s*platform\s*:ios.*$", pod, flags=re.MULTILINE):
            pod = re.sub(
                r"^\s*#?\s*platform\s*:ios.*$",
                "platform :ios, '14.0'",
                pod,
                flags=re.MULTILINE,
            )
        else:
            pod = "platform :ios, '14.0'\n" + pod
        with open(podfile_path, "w", encoding="utf-8") as f:
            f.write(pod)
        print("Patched ios/Podfile to platform :ios, '14.0'")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--platform",
        choices=("android", "ios", "all"),
        default="all",
    )
    args = parser.parse_args()
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    remove_default_widget_test(root_dir)
    if args.platform in ("android", "all"):
        configure_android(root_dir)
    if args.platform in ("ios", "all"):
        configure_ios(root_dir)


if __name__ == "__main__":
    main()
