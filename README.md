# docs-i18n

**The official document skills produce empty boxes for most of the world's writing systems.**

Not a rendering quirk. It follows directly from the font list they mandate.

## The measurement

`skills/xlsx/SKILL.md` requires *"Professional font (Arial, Times New Roman)
throughout"*. `skills/pptx/SKILL.md` lists the safe fonts as *"Arial, Calibri,
Cambria, Times New Roman, Courier New, Bookman Old Style, Century Schoolbook"*.

Reading the cmap table of each one:

| Mandated font | Hebrew | Arabic | CJK | Devanagari | Thai | Cyrillic | Greek |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Arial | yes | yes | **no** | **no** | **no** | yes | yes |
| Calibri | yes | yes | **no** | **no** | **no** | yes | yes |
| Cambria | **no** | **no** | **no** | **no** | **no** | yes | yes |
| Times New Roman | yes | yes | **no** | **no** | **no** | yes | yes |
| Courier New | yes | yes | **no** | **no** | **no** | yes | yes |
| Bookman Old Style | **no** | **no** | **no** | **no** | **no** | yes | yes |
| Century Schoolbook | **no** | **no** | **no** | **no** | **no** | yes | yes |

**Chinese, Japanese, Korean, Hindi and Thai are unsupported by every font on the
list.** Hebrew and Arabic fail on three of seven.

Cyrillic and Greek pass completely, which is exactly why nobody noticed. If you
test in a European language everything looks fine.

Reproduce it in ten seconds, no install of this skill required:

```bash
pip install fonttools
python plugins/docs-i18n/skills/docs-i18n/scripts/font-coverage.py
```

## The part that makes it strange

The capability is already in the box. The ISO/IEC 29500 schemas bundled inside
those very skills define `w:rtl`, `w:bidi`, `w:cs`, `rightToLeft` and
`eastAsia`.

Across the 56 instruction and code files of the docx, pptx, xlsx and pdf skills,
the number of references to any of them is **zero**. The schema ships. The
instructions never open it.

Meanwhile `skills/pdf/SKILL.md` documents the exact failure mode, that missing
glyphs render as solid black boxes, and scopes the warning to Unicode
subscripts without ever generalising it to entire writing systems.

And the self-check cannot catch it: the pptx QA renderer draws its preview
thumbnails with a default Latin bitmap font, so a missing glyph looks identical
to a present one.

## What this skill does

1. Picks a font that actually contains the script you are writing in
2. Sets the three OOXML font slots separately, because Latin, complex script and
   East Asian are tracked independently and setting only the first is the usual
   mistake
3. Sets direction as well as font, since an RTL document with the right font and
   no `w:bidi` still reads wrong
4. Registers and embeds fonts for PDF, and reshapes Arabic so the letters join
5. Verifies against the real file rather than a generated thumbnail

Exact elements and working `python-docx`, `python-pptx`, `openpyxl` and
`reportlab` snippets are in
[references/ooxml.md](plugins/docs-i18n/skills/docs-i18n/references/ooxml.md).

## Install

```bash
/plugin marketplace add finestructure-ai/docs-i18n
```

```bash
/plugin install docs-i18n@finestructure-docs-i18n
```

Then `/reload-plugins`.

## Scope, honestly

This does not replace the official skills. Use them, and use this alongside so
their output survives contact with a non-Latin script.

It also cannot fix a font that is not installed on the machine. Where the right
font is absent it says so rather than picking a Latin one and producing boxes.

## Who makes this

Built by [Fine Structure](https://finestructure.ai), which ships apps in 18
languages including right to left. MIT, no telemetry.

Adding the marketplace also gives you **ship-live** (take a prototype to a
verified live URL) and **share-live** (turn what you built into a link you can
send). The [full catalog](https://github.com/finestructure-ai/humanizer-multilingual)
has seven more.

## Contributing

The measurement script takes a font path and a code point. If a font in your
locale is missing from the recommendation table, or a recommendation is wrong on
your platform, open an issue with the output of the script. Platform-specific
corrections are the most useful contribution here, because font availability is
the whole problem.

## License

MIT.
