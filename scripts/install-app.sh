#!/usr/bin/env bash
# Legt „Fleet Console.app" an — ein Programm zum Doppelklicken, das den Server
# startet und die Konsole im Browser öffnet.
#
#   scripts/install-app.sh              → auf den Schreibtisch
#   scripts/install-app.sh ~/Applications  → woandershin
#
# Das Programm ist nur eine Hülle: die Arbeit macht scripts/start.sh im Repo.
# Änderungen daran wirken sofort, das Programm muss nicht neu angelegt werden.
# Zieht das Repo um, muss dieses Skript einmal erneut laufen.

set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ZIEL="${1:-$HOME/Desktop}"
APP="$ZIEL/Fleet Console.app"

[ -d "$ZIEL" ] || { echo "Zielordner gibt es nicht: $ZIEL"; exit 1; }

rm -rf "$APP"
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources"
cp "$REPO/scripts/AppIcon.icns" "$APP/Contents/Resources/AppIcon.icns"

cat > "$APP/Contents/Info.plist" <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleName</key><string>Fleet Console</string>
  <key>CFBundleDisplayName</key><string>Fleet Console</string>
  <key>CFBundleIdentifier</key><string>org.walbrunn.fleet-console</string>
  <key>CFBundleVersion</key><string>1.0</string>
  <key>CFBundleShortVersionString</key><string>1.0</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleExecutable</key><string>FleetConsole</string>
  <key>CFBundleIconFile</key><string>AppIcon</string>
  <!-- Kein Eintrag im Dock und kein Menü: das Programm startet den Server und
       ist danach fertig. Bedient wird im Browser. -->
  <key>LSUIElement</key><true/>
  <key>NSHighResolutionCapable</key><true/>
</dict>
</plist>
PLIST

cat > "$APP/Contents/MacOS/FleetConsole" <<SH
#!/usr/bin/env bash
exec "$REPO/scripts/start.sh" start
SH

chmod +x "$APP/Contents/MacOS/FleetConsole"
chmod +x "$REPO/scripts/start.sh"
# Ohne das zeigt der Finder eine Weile noch das alte (oder gar kein) Symbol.
touch "$APP"

echo "Angelegt: $APP"
echo "Zeigt auf: $REPO/scripts/start.sh"
