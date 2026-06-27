#!/usr/bin/env bash

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SCRIPTS_DIR="$ROOT/scripts"
EXTENSION_PATH="$ROOT/statlens"
TARGET_EXT_DIR="$HOME/.local/share/gnome-shell/extensions"

UUID=$(jq -r '.uuid' "$EXTENSION_PATH/metadata.json")

if [ -d "$EXTENSION_PATH/schemas" ]; then
  "$SCRIPTS_DIR/compile.sh"
fi

mkdir -p "$TARGET_EXT_DIR/$UUID"
cp -a "$EXTENSION_PATH"/* "$TARGET_EXT_DIR/$UUID/"

if [ -d "$TARGET_EXT_DIR/$UUID/schemas" ]; then
  glib-compile-schemas "$TARGET_EXT_DIR/$UUID/schemas"
fi

echo "Installed: $UUID"
