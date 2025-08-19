import fontforge
import re

font = fontforge.open("lishogi_better.sfd")

def to_camel_case(s: str) -> str:
    parts = re.split(r"[_\-\s]+", s)
    return parts[0].lower() + "".join(p.title() for p in parts[1:])

with open("icons.ts", "w", encoding="utf-8") as f:
    f.write("export const icons = {\n")

    for glyph in font.glyphs():
        if glyph.unicode != -1:
            char = chr(glyph.unicode)
            if char == '`' or char == '\\':
                char = '\\' + char
            key = to_camel_case(glyph.glyphname)
            f.write(f'  {key}: `{char}`,\n')

    f.write("} as const;\n")
