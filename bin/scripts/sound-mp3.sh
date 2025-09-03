#!/usr/bin/env bash
set -euo pipefail

srcdir="../public/sound/ogg"
dstdir="../public/sound/mp3"

if find "$srcdir" -type f ! -name '*.ogg' -o -type l ! -name '*.ogg' | grep -q .; then
  echo "Error: $srcdir contains non-ogg files" >&2
  exit 1
fi

rm -rf "$dstdir"
echo "Cleared" $dstdir
mkdir -p "$dstdir"

find "$srcdir" \( -type f -o -type l \) -name '*.ogg' | while read -r file; do
  echo $file
  rel="${file#$srcdir/}"
  out="$dstdir/${rel%.ogg}.mp3"
  mkdir -p "$(dirname "$out")"

  if [ -L "$file" ]; then
    target=$(readlink "$file")
    target_rel="${target%.ogg}.mp3"
    ln -sf "$target_rel" "$out"
  else
    ffmpeg -hide_banner -loglevel error -y -i "$file" "$out"
  fi
done

echo "Done!"