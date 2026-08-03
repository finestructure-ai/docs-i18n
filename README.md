# docs-i18n

**The font you specify is not the font your reader gets, for most of the world's writing systems.**

The official document skills recommend a font list. For Chinese, Japanese,
Korean, Hindi and Thai, not one font on that list contains the glyphs.

What happens next depends on the renderer, and this is the part worth being
precise about:

- **In Word and PowerPoint**, the application usually substitutes some other
  font it finds locally. You do not get boxes, you get *a different font than
  the one you asked for*, chosen by the reader's machine, varying between
  machines. Every typographic decision in the document is silently discarded for
  that text.
- **In PDF**, there is no substitution. The official `pdf` skill documents this
  outcome itself: missing glyphs render as solid black boxes. It scopes the
  warning to Unicode subscripts and never generalises it to entire writing
  systems.

I measured font coverage directly. I did not test every renderer's fallback
behaviour, so treat the Word and PowerPoint description above as the documented
behaviour of font substitution rather than something I verified per version.

## The measurement

`skills/xlsx/SKILL.md` asks for a *"Professional font (Arial, Times New Roman)
throughout, unless the user says otherwise"*. `skills/pptx/SKILL.md` lists safe
fonts as *"Arial, Calibri, Cambria, Times New Roman, Courier New, Bookman Old
Style, Century Schoolbook"* and says to use them "for body text and anything
where fit matters". Neither is an absolute rule, and that matters: the issue is
not that they forbid a Chinese font, it is that nothing anywhere tells you to
reach for one.

Reading the cmap table of each one:

| Recommended font | Hebrew | Arabic | CJK | Devanagari | Thai | Cyrillic | Greek |
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

To be fair to the skills, they are not silent about fonts in general. The pptx
skill states plainly that QA renders through LibreOffice, which substitutes
fonts it does not have, and warns that the preview can therefore differ from the
real deck. What is absent is any mention of non-Latin scripts specifically, or
of the elements that handle them.

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
