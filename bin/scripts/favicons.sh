#!/bin/sh

file=../public/logo/lishogi-favicon-1024.png

for px in 512 256 192 128 64 32; do
  magick $file -scale ${px}x${px} ../public/logo/lishogi-favicon-${px}.png

magick $file -scale 32x32 -channel RGB -negate +channel ../public/logo/lishogi-favicon-32-invert.png

done
