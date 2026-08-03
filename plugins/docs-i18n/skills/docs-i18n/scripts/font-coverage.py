# Do the fonts mandated by the official Anthropic document skills actually
# contain the glyphs for non-Latin scripts? Reads the cmap table directly.
import glob, os, sys
from fontTools.ttLib import TTFont

# Exactly the fonts named in skills/pptx/SKILL.md:131 and skills/xlsx/SKILL.md:22
MANDATED = {
    "Arial": ["arial.ttf", "ARIAL.TTF"],
    "Calibri": ["calibri.ttf", "CALIBRI.TTF"],
    "Cambria": ["cambria.ttc", "CAMBRIA.TTC"],
    "Times New Roman": ["times.ttf", "TIMES.TTF"],
    "Courier New": ["cour.ttf", "COUR.TTF"],
    "Bookman Old Style": ["BOOKOS.TTF", "bookos.ttf"],
    "Century Schoolbook": ["SCHLBK.TTF", "schlbk.ttf", "CENSCBK.TTF"],
}

SCRIPTS = {
    "Hebrew": 0x05D0,        # alef
    "Arabic": 0x0627,        # alef
    "CJK": 0x4E00,           # yi
    "Cyrillic": 0x0410,      # A
    "Greek": 0x0391,         # Alpha
    "Devanagari": 0x0915,    # ka
    "Thai": 0x0E01,          # ko kai
}

FONTDIR = r"C:\Windows\Fonts"

def covered(path, cp):
    try:
        f = TTFont(path, fontNumber=0, lazy=True)
        for t in f["cmap"].tables:
            if cp in t.cmap:
                return True
        return False
    except Exception:
        return None

rows = []
for name, candidates in MANDATED.items():
    path = None
    for c in candidates:
        p = os.path.join(FONTDIR, c)
        if os.path.exists(p):
            path = p
            break
    if not path:
        hits = glob.glob(os.path.join(FONTDIR, candidates[0].split('.')[0] + "*"))
        path = hits[0] if hits else None
    if not path:
        rows.append((name, "NOT INSTALLED", {}))
        continue
    res = {s: covered(path, cp) for s, cp in SCRIPTS.items()}
    rows.append((name, os.path.basename(path), res))

w = max(len(r[0]) for r in rows) + 2
hdr = "font".ljust(w) + "".join(s.ljust(13) for s in SCRIPTS)
print(hdr)
print("-" * len(hdr))
missing_counts = {s: 0 for s in SCRIPTS}
tested = 0
for name, fname, res in rows:
    if not res:
        print(name.ljust(w) + "(not installed)")
        continue
    tested += 1
    line = name.ljust(w)
    for s in SCRIPTS:
        v = res.get(s)
        line += ("yes" if v else "NO ").ljust(13)
        if not v:
            missing_counts[s] += 1
    print(line)

print()
print(f"fonts tested: {tested} of {len(MANDATED)}")
for s in SCRIPTS:
    print(f"  {s:<12} unsupported by {missing_counts[s]}/{tested} of the mandated fonts")
