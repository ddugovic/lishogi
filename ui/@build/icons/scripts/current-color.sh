#! /bin/bash

for f in "$@"; do
  sed -i -E '
    s/fill="(#fff|#ffffff|white)"/fill="currentColor"/gi;
    s/stroke="(#fff|#ffffff|white)"/stroke="currentColor"/gi
  ' "$f"
done