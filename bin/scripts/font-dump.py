#!/usr/bin/env python3

import fontforge
import re
import os
import sys

fontDir = "../public/font"
fontSfd = "lishogi.sfd"
font = fontforge.open(os.path.join(fontDir, fontSfd))

uiCommonDir = "../ui/common"
tsExportPath = os.path.join(uiCommonDir, "src/icons.ts")
scssExportPath = os.path.join(uiCommonDir, "css/abstract/_icons.scss")

scalaExportPath = "../modules/common/src/main/Icons.scala"

comment = f"Auto generated file via {os.path.basename(__file__)}"

glyphs = sorted(font.glyphs(), key=lambda g: g.glyphname)

def to_camel_case(s: str) -> str:
    parts = re.split(r"[_\-\s]+", s)
    return parts[0].lower() + "".join(p.title() for p in parts[1:])

def to_kebab_case(s: str) -> str:
    parts = re.split(r"[_\-\s]+", s)
    return "-".join(p.lower() for p in parts if p)

# ts export
with open(tsExportPath, "w", encoding="utf-8") as f:
    f.write(f"""// {comment}

export const icons = {{
""")

    for glyph in glyphs:
        if glyph.unicode != -1:
            char = chr(glyph.unicode)
            if char == "'":
                char = f'"{char}"'
            elif char == '\\':
                char = f"'\\{char}'"
            else:
                char = f"'{char}'"
            key = to_camel_case(glyph.glyphname)
            f.write(f"  {key}: {char},\n")

    f.write("} as const;\n")
    print(f"TS - Wrote {f.name}")

# scss export
with open(scssExportPath, "w", encoding="utf-8") as f:
    f.write(f"""// {comment}

""")
    for glyph in glyphs:
        if glyph.unicode != -1:
            char = chr(glyph.unicode)
            if char == "'":
                char = f'"{char}"'
            elif char == '\\':
                char = f"'\\{char}'"
            else:
                char = f"'{char}'"
            key = to_kebab_case(glyph.glyphname)
            f.write(f'${key}: {char};\n')

    print(f"SCSS - Wrote {f.name}")

# scala export
if "no-scala" not in sys.argv:
    with open(scalaExportPath, "w", encoding="utf-8") as f:
        f.write(f"""// {comment}
package lila.common
// format: off
object Icons {{
""")

        for glyph in glyphs:
            if glyph.unicode != -1:
                char = chr(glyph.unicode)
                key = to_camel_case(glyph.glyphname)
                # escape backslash and double quote for Scala
                if char == '\\':
                    char = '\\\\'
                elif char == '"':
                    char = '\\"'
                f.write(f'  val {key} = "{char}"\n')

        f.write("}\n")
        print(f"Scala - Wrote {f.name}")
