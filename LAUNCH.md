# Launch drafts

Not published. Read before anything goes out.

Two principles behind the wording:

1. **The finding is the post. The skill is a footnote.** Every repo that broke
   out did this. A post that leads with "I built a thing" gets ignored.
2. **State the limits of the measurement inside the post.** The first comment on
   anything like this is someone finding a hole. Naming the hole first is what
   makes the rest credible.

Fine Structure is not pitched in either draft. It is in the repo README, which
is where someone who cares will look.

---

## Draft A: Hacker News

**Title**

```
Every font Claude's official document skills recommend fails on Chinese, Japanese and Hindi
```

**Body**

```
Claude ships official skills for generating .docx, .pptx, .xlsx and .pdf. They
mandate a font list: Arial, Calibri, Cambria, Times New Roman, Courier New,
Bookman Old Style, Century Schoolbook.

I read the cmap table of each one:

                    Hebrew  Arabic  CJK  Devanagari  Thai  Cyrillic  Greek
Arial                 yes     yes    no      no       no      yes     yes
Calibri               yes     yes    no      no       no      yes     yes
Cambria                no      no    no      no       no      yes     yes
Times New Roman       yes     yes    no      no       no      yes     yes
Courier New           yes     yes    no      no       no      yes     yes
Bookman Old Style      no      no    no      no       no      yes     yes
Century Schoolbook     no      no    no      no       no      yes     yes

Chinese, Japanese, Korean, Hindi and Thai are covered by zero of the seven.
Hebrew and Arabic fail on three.

Cyrillic and Greek pass completely, which I think is why it went unnoticed. If
you test in a European language everything looks right.

What actually happens downstream is worth being precise about, because "it shows
boxes" is only true sometimes. Word and PowerPoint font-substitute, so you get a
different font than the one you specified, picked by the reader's machine and
varying between machines. PDF does not substitute, and the official pdf skill
documents that outcome itself: missing glyphs become solid black boxes. It scopes
that warning to Unicode subscripts and never generalises it.

The odd part is that the capability is already in the box. The ISO/IEC 29500
schemas bundled inside those same skills define w:rtl, w:bidi, w:cs,
rightToLeft and eastAsia. Across the 56 instruction and code files of the four
skills, the number of references to any of them is zero. The schema ships, the
instructions never open it.

The self-check cannot catch it either. The pptx QA step renders preview
thumbnails with a default Latin bitmap font, so a missing glyph and a present one
look identical in the preview.

Measurement script and the OOXML elements that fix it:
https://github.com/finestructure-ai/docs-i18n

Caveats: I measured on Windows with the fonts Office installs there. Coverage can
differ by font version and platform, so the script takes a font path and a code
point and you should run it on yours. I did not test every renderer's fallback
behaviour, so the Word and PowerPoint description above is documented
substitution behaviour rather than something I verified per version.
```

---

## Draft B: Reddit, r/ClaudeAI

More personal. Same facts.

**Title**

```
I found out why my Hebrew documents from Claude looked wrong. It's the font list.
```

**Body**

```
I build in Hebrew, so I hit this early and assumed it was me.

Claude's official document skills mandate a font list for .docx, .pptx and
.xlsx: Arial, Calibri, Cambria, Times New Roman, Courier New, Bookman Old Style,
Century Schoolbook.

I read the cmap table of each. Cambria, Bookman Old Style and Century Schoolbook
contain no Hebrew and no Arabic at all. And all seven of them contain no
Chinese, Japanese, Korean, Hindi or Thai.

Cyrillic and Greek are fine in every one, which is probably why nobody noticed.
Test in a European language and it looks perfect.

Word usually substitutes a font rather than showing boxes, so it does not look
broken, it looks like your typography choices were quietly ignored. In PDF you
do get missing glyphs, and the official pdf skill actually documents that
outcome for subscripts without connecting it to entire writing systems.

What surprised me most: the OOXML schemas shipped inside those very skills
already define w:rtl, w:bidi, w:cs and eastAsia. Nothing is missing from the
format. The instructions just never use them.

Script to check it yourself, plus the elements that fix it:
https://github.com/finestructure-ai/docs-i18n

Measured on Windows with Office fonts. If you run it on macOS or Linux and get
different coverage I would genuinely like to know, that is the number I am least
sure about.
```

---

## Before posting

- The three awesome-list PRs are still open. Nothing depends on them, but a
  merged listing before a launch would help.
- Expect the first serious reply to be about font substitution, or about a font
  version where coverage differs. Both are already named in the post, which is
  the point.
- If someone asks what Fine Structure is, answer plainly and briefly and go back
  to the topic. Leading with it is what kills posts like this.

## What not to do

- Do not post the same text to several subreddits at once. Pick one.
- Do not post as a vendor. The credible frame is the person who hit the problem,
  because that is true.
- Do not overclaim. "Fails on" is measured and defensible. "Broken" is not.
