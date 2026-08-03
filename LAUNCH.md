# Launch drafts

Not published. Read before anything goes out.

Two principles behind the wording:

1. **The finding is the post. The skill is a footnote.** Every repo that broke
   out did this. A post that leads with "I built a thing" gets ignored.
2. **State the limits of the measurement inside the post.** The first comment on
   anything like this is someone finding a hole. Naming the hole first is what
   makes the rest credible.
3. **Lead with the scripts that fail on all seven fonts**, which are Chinese,
   Japanese, Korean, Hindi and Thai. Hebrew and Arabic fail on three of seven,
   so they are the weaker half of the finding and belong in the table rather
   than in the headline. This also keeps the post about a measurement instead of
   about one language and the arguments that tend to follow.

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

**Written to the measured shape of that sub, not to the HN shape.** From our own
data (2026-07-30): a 167 character comment scored 839 there, comments under 500
characters average 14.65 points against 2.5 for anything over 800, and the sub
actively mocks AI writing tells by name. A long tidy post with a table is the
exact shape that gets called slop there, regardless of whether the content is
good.

So this is short, takes a position, and is not polished smooth.

**Title**

```
Claude's document skills recommend 7 fonts. None of them have Chinese, Japanese, Korean, Hindi or Thai.
```

**Body**

```
The official docx/pptx/xlsx skills tell you to use Arial, Calibri, Cambria,
Times New Roman, Courier New, Bookman Old Style or Century Schoolbook.

I pulled the cmap table on all seven. Zero CJK, zero Devanagari, zero Thai.
Cambria and the two book fonts don't have Hebrew or Arabic either. Cyrillic and
Greek are fine in all of them, which is presumably why this survived.

Word hides it by substituting a font, so you don't get boxes, you just quietly
get a different font than the one you asked for. PDF doesn't substitute.

script to check your own font set:
https://github.com/finestructure-ai/docs-i18n

only tested on windows office fonts, no idea if mac differs
```

**Notes on the wording, so it does not get sanded flat in editing**

- No table. A table is the single most generated-looking element on Reddit.
- Contractions and one lowercase closing line, because uniformly perfect
  capitalization is itself a tell there. Do not "fix" the last line.
- The uncertainty at the end is short and offhand rather than a formal caveats
  paragraph. Same honesty, different register.
- No credential, no "I ship software in 18 languages". In this sub that reads as
  positioning. On HN it reads as context, which is why the HN draft keeps it.

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
