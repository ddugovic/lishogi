#! /bin/bash

for f in "$@"; do
  inkscape --actions="select-all;object-align:hcenter vcenter page;export-filename:out/$f;export-do;" "$f";
done