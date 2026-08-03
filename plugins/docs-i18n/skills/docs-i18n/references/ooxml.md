# The OOXML elements that actually do the work

Every element below is defined in the ISO/IEC 29500 schemas that ship inside the
official document skills. Nothing here is exotic, it is simply never used.

## Word (docx)

OOXML tracks three font slots per run, and setting only the first is the usual
mistake.

```xml
<w:rPr>
  <w:rFonts w:ascii="Arial"        <!-- Latin        -->
            w:hAnsi="Arial"        <!-- Latin high   -->
            w:cs="Arial"           <!-- complex script: Hebrew, Arabic -->
            w:eastAsia="Yu Gothic"/><!-- CJK          -->
</w:rPr>
```

Hebrew and Arabic read from `w:cs`. Chinese, Japanese and Korean read from
`w:eastAsia`. A run with only `w:ascii` set falls back to a default that may
have no glyphs, which is the box.

Direction is separate from font:

```xml
<w:pPr>
  <w:bidi/>                                   <!-- paragraph is RTL -->
  <w:jc w:val="right"/>
</w:pPr>
<w:rPr>
  <w:rtl/>                                    <!-- run is RTL -->
  <w:lang w:bidi="he-IL"/>                    <!-- language for the RTL run -->
</w:rPr>
```

With `python-docx`, the high level API does not expose these, so set them on the
underlying XML:

```python
from docx.oxml.ns import qn

run = paragraph.add_run("שלום עולם")
rPr = run._element.get_or_add_rPr()

rFonts = rPr.get_or_add_rFonts()
rFonts.set(qn('w:cs'), 'Arial')
rFonts.set(qn('w:ascii'), 'Arial')
rFonts.set(qn('w:hAnsi'), 'Arial')

rtl = rPr.makeelement(qn('w:rtl'), {})
rPr.append(rtl)

pPr = paragraph._p.get_or_add_pPr()
pPr.append(pPr.makeelement(qn('w:bidi'), {}))
```

For a whole document, also set it on the default style so inserted text inherits
it rather than reverting.

## PowerPoint (pptx)

Same three-slot idea, different element names:

```xml
<a:rPr lang="he-IL" rtl="1">
  <a:latin typeface="Arial"/>
  <a:cs    typeface="Arial"/>       <!-- Hebrew, Arabic -->
  <a:ea    typeface="Yu Gothic"/>   <!-- CJK -->
</a:rPr>
```

Paragraph direction sits on `a:pPr`:

```xml
<a:pPr rtl="1" algn="r"/>
```

With `python-pptx`:

```python
from pptx.oxml.ns import qn

run = paragraph.add_run()
run.text = "مرحبا"
rPr = run._r.get_or_add_rPr()
rPr.set('lang', 'ar-SA')
rPr.set('rtl', '1')
for tag, face in (('a:latin', 'Arial'), ('a:cs', 'Arial')):
    el = rPr.makeelement(qn(tag), {'typeface': face})
    rPr.append(el)

pPr = paragraph._p.get_or_add_pPr()
pPr.set('rtl', '1')
pPr.set('algn', 'r')
```

Autofit and overflow checks assume Latin metrics. CJK glyphs are full width and
Arabic joins, so a string that fits in the QA pass can still overflow in the
real render. Leave more slack than the Latin case suggests.

## Excel (xlsx)

Sheet direction is a view property, not a cell format:

```xml
<sheetView rightToLeft="1" workbookViewId="0"/>
```

With `openpyxl`:

```python
ws.sheet_view.rightToLeft = True
ws['A1'].font = Font(name='Arial')   # not Cambria, it has no Hebrew
```

Column A then appears on the right, which is what a Hebrew or Arabic reader
expects. Numbers stay left to right inside their cells, and that is correct.

## PDF

There are no font slots, only embedded fonts.

```python
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.cidfonts import UnicodeCIDFont

pdfmetrics.registerFont(TTFont("NotoHebrew", "NotoSansHebrew-Regular.ttf"))
pdfmetrics.registerFont(UnicodeCIDFont("STSong-Light"))   # Chinese, built in
```

Arabic additionally needs shaping, because reportlab draws code points and does
not join letters:

```python
import arabic_reshaper
from bidi.algorithm import get_display

text = get_display(arabic_reshaper.reshape("مرحبا بالعالم"))
```

Hebrew needs `get_display` for the bidi reordering but no reshaping, since
Hebrew letters do not join.

Without this, Arabic renders as isolated disconnected forms in the wrong order.
It is not unreadable in the way a box is, which makes it worse: it looks like
text and no native reader can parse it.

## Verifying

Do not trust a generated thumbnail. The official pptx QA renderer uses a default
bitmap font, so a missing glyph and a present one look the same.

Check coverage before writing:

```python
from fontTools.ttLib import TTFont
def has(path, cp):
    f = TTFont(path, fontNumber=0, lazy=True)
    return any(cp in t.cmap for t in f["cmap"].tables)

has(r"C:\Windows\Fonts\CAMBRIA.TTC", 0x05D0)   # False, Hebrew alef
```

Then open the actual output file.
