#!/usr/bin/env bash

if ! command -v fontforge > /dev/null 2>&1; then
  echo "Error: fontforge not found. Install it first." >&2
  exit 1  
fi

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
SFD_FILE="$ROOT_DIR/public/font/lishogi.sfd"
BASE="${SFD_FILE%.*}"

if [ ! -f "$SFD_FILE" ]; then
  echo "Error: SFD file not found at $SFD_FILE" >&2
  exit 1
fi

echo "Generating $BASE.woff and $BASE.woff2"
echo ""
fontforge -lang=ff -c "Open(\"$SFD_FILE\"); Generate(\"$BASE.woff\"); Generate(\"$BASE.woff2\")"

fontforge --version 2> /dev/null > "$BASE.version"
echo ""
echo "Saved FontForge version to $BASE.version"