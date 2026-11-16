#!/usr/bin/env python3
"""Injeta o esquema omnistudio:// no projeto nativo gerado pelo Capacitor.

Uso:
  python3 scripts/inject-url-scheme.py ios
  python3 scripts/inject-url-scheme.py android
"""
import pathlib
import plistlib
import re
import sys

SCHEME = "omnistudio"
NAME = "com.sysarchx.omnistudio"


def inject_ios() -> None:
    plist_path = pathlib.Path("ios/App/App/Info.plist")
    with plist_path.open("rb") as handle:
        data = plistlib.load(handle)

    entries = data.get("CFBundleURLTypes") or []
    updated = False
    for entry in entries:
        schemes = entry.get("CFBundleURLSchemes") or []
        if SCHEME in schemes:
            updated = True
            break
    if not updated:
        entries.append({"CFBundleURLName": NAME, "CFBundleURLSchemes": [SCHEME]})
        data["CFBundleURLTypes"] = entries
        with plist_path.open("wb") as handle:
            plistlib.dump(data, handle)
    print(f"iOS: CFBundleURLSchemes -> {SCHEME} em {plist_path}")


def inject_android() -> None:
    manifest = pathlib.Path("android/app/src/main/AndroidManifest.xml")
    text = manifest.read_text(encoding="utf-8")
    if f'android:scheme="{SCHEME}"' in text:
        print("Android: intent-filter já presente")
        return

    # Encontra a activity que hospeda o WebView (MainActivity) e insere o filtro nela.
    match = re.search(r'(<activity\b[^>]*android:name="\.MainActivity"[^>]*>)', text)
    if not match:
        match = re.search(r"(<activity\b[^>]*>)", text)
    if not match:
        raise SystemExit("AndroidManifest.xml sem <activity>: nada para editar.")

    intent_filter = (
        "\n            <intent-filter android:autoVerify=\"false\">"
        "\n                <action android:name=\"android.intent.action.VIEW\" />"
        "\n                <category android:name=\"android.intent.category.DEFAULT\" />"
        "\n                <category android:name=\"android.intent.category.BROWSABLE\" />"
        f"\n                <data android:scheme=\"{SCHEME}\" android:host=\"auth\" />"
        "\n            </intent-filter>"
    )
    insert_at = match.end()
    manifest.write_text(text[:insert_at] + intent_filter + text[insert_at:], encoding="utf-8")
    print(f"Android: intent-filter {SCHEME}://auth adicionado em {manifest}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        raise SystemExit("Informe ios ou android")
    platform = sys.argv[1]
    if platform == "ios":
        inject_ios()
    elif platform == "android":
        inject_android()
    else:
        raise SystemExit(f"Plataforma desconhecida: {platform}")
