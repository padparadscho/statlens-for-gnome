#!/usr/bin/env bash

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SCHEMAS_DIR="$ROOT/statlens/schemas"

if [ ! -d "$SCHEMAS_DIR" ]; then
  echo "No schemas directory found at $SCHEMAS_DIR"
  exit 0
fi

echo "Compiling schemas in $SCHEMAS_DIR"
glib-compile-schemas "$SCHEMAS_DIR"
echo "Done."
