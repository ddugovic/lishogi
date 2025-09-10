#!/usr/bin/env bash

VOLUME_INCREASE=4

shopt -s globstar nullglob

for f in ../public/sound/ogg/clock/sakura_ajisai/**/*.ogg; do
  tmp="${f%.ogg}_tmp.ogg"
  echo "Increasing volume of $f by ${VOLUME_INCREASE}dB"
  ffmpeg -i "$f" -af "volume=${VOLUME_INCREASE}dB" -y "$tmp"
  mv -f "$tmp" "$f"
done

echo "Done."