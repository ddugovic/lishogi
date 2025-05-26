#!/bin/bash

if [ -z "$1" ]; then
  echo "Usage: $0 <directory>"
  exit 1
fi

DIR="$1"

if [ ! -d "$DIR" ]; then
  echo "Error: '$DIR' is not a directory"
  exit 1
fi

for file in "$DIR"/0*.png; do
  filename=$(basename "$file")
  new_filename="1${filename:1}"
  convert "$file" -rotate 180 "$DIR/$new_filename"
done
