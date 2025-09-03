#!/usr/bin/env bash

# Usage: ./normalize.sh reference.ogg
# Will normalize all other .ogg files in the sound dir to match reference.ogg
# Should run sound-mp3.sh after

ref="$1"
if [[ -z "$ref" ]]; then
  echo "Usage: $0 reference.ogg"
  exit 1
fi

echo "Analyzing reference: $ref"
analysis=$(ffmpeg -i "$ref" -af loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json -f null - 2>&1)
measured_I=$(echo "$analysis" | grep 'input_i'     | grep -oE '[-0-9\.]+')
measured_TP=$(echo "$analysis" | grep 'input_tp'    | grep -oE '[-0-9\.]+')
measured_LRA=$(echo "$analysis" | grep 'input_lra'   | grep -oE '[-0-9\.]+')
measured_thresh=$(echo "$analysis" | grep 'input_thresh' | grep -oE '[-0-9\.]+')
offset=$(echo "$analysis" | grep 'target_offset' | grep -oE '[-0-9\.]+')

echo "Reference loudness extracted:"
echo "  I=$measured_I, TP=$measured_TP, LRA=$measured_LRA, Thresh=$measured_thresh, Offset=$offset"

for f in ../public/sound/ogg/**/*.ogg; do
  [[ "$f" == "$ref" ]] && continue
  tmp="${f%.ogg}_tmp.ogg"
  echo "Normalizing $f"
  ffmpeg -y -i "$f" -af loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=$measured_I:measured_TP=$measured_TP:measured_LRA=$measured_LRA:measured_thresh=$measured_thresh:offset=$offset:linear=true "$tmp" \
  # && mv -f "$tmp" "$f"
done

echo "Done."
