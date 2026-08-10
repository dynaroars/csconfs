# CSConfs — FAQ

Questions about the site, the data, and how to fix something that looks wrong.
For how to run or contribute to the project, see the [README](README.md).

---

## What is CSConfs?

A deadline tracker for top Computer Science conferences — submission and
abstract deadlines, notification dates, conference dates, and locations. The
conference set comes from [CSRankings](https://csrankings.org/) and
[CORE](https://portal.core.edu.au/conf-ranks/) (A\*).

It is a static site. There is no account, no tracking, and no server — the whole
database is a file in this repository.

---

## Where does the data come from?

Conference details are maintained in
[`public/data/conferences.yaml`](public/data/conferences.yaml) in this
repository, assembled from conference websites, contributor pull requests, and
the sources credited below.

### Credits

**[CCFDDL / ccf-deadlines](https://github.com/ccfddl/ccf-deadlines)** — a
community-maintained conference deadline database. CSConfs syncs against it
weekly to verify and correct submission and abstract deadlines. It covers 66 of
the 73 conferences tracked here, and where it and our records disagree about a
deadline, CCFDDL wins. Thanks to its maintainers for keeping it current.

> CCFDDL is MIT licensed:
>
> ```
> MIT License
>
> Copyright (c) 2021 CCFDDL
>
> Permission is hereby granted, free of charge, to any person obtaining a copy
> of this software and associated documentation files (the "Software"), to deal
> in the Software without restriction, including without limitation the rights
> to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
> copies of the Software, and to permit persons to whom the Software is
> furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all
> copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
> IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
> FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
> AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
> LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
> OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
> SOFTWARE.
> ```

**[CSRankings](https://csrankings.org/)** — defines the conference set and the
research-area tree used by the sidebar filters.

**[CORE](https://portal.core.edu.au/conf-ranks/)** — the CORE A\* conference
ranking, offered as an alternative filter set.

**[emeryberger/csconferences](https://github.com/emeryberger/csconferences)** —
historical acceptance and submission counts, used for the acceptance rates and
the statistics view.

---

## What does the "Estimated" badge mean?

That entry's dates are a **projection**, not an announcement. When a conference
has not published its next call for papers, we carry last year's timeline
forward by a year so the conference still appears in your planning view.

Treat estimated dates as a rough guide and always confirm on the conference
website before relying on one. Use the **Show Estimated** toggle to hide them
entirely.

An estimated entry is replaced with real dates as soon as they are published or
CCFDDL confirms them.

---

## How are deadlines and countdowns handled?

Dates are shown exactly as the conference records them — no timezone conversion.
A deadline listed as `2026-12-08` displays as 12/08/2026 wherever you are.

The live **countdown** is the exception: it counts down to the end of the
deadline day in **AoE** (Anywhere on Earth, UTC−12), which is the convention
almost every CS conference uses. That means the countdown can still show time
remaining after the date has passed in your local timezone — that is correct,
and matches how the conference will treat your submission.

---

## How often is the data updated?

- **Weekly**, automatically, against CCFDDL, every Monday.
- **Continuously**, whenever a maintainer or contributor edits the database.

The seven conferences CCFDDL does not cover — EC, ISMB, ISMB/ECCB, KDD,
SIGCSE TS, SIGGRAPH, and SIGGRAPH Asia — are maintained by hand, so corrections
there are especially welcome.

---

## A date is wrong. How do I fix it?

Any of these work:

1. **Open an issue.** [Report it here](https://github.com/dynaroars/csconfs/issues)
   with the conference, year, and the correct date — ideally with a link to the
   official call for papers.
2. **Send a pull request.** Edit
   [`public/data/conferences.yaml`](public/data/conferences.yaml) directly. See
   the [entry reference](README.md#conference-entry-reference) for the fields.
3. **Fix it upstream.** If the conference is in
   [CCFDDL](https://github.com/ccfddl/ccf-deadlines), correcting it there fixes
   it for CSConfs and for everyone else using that database. This is the most
   useful option when it applies.

---

## Why is a conference missing?

Most likely it is outside the tracked set — CSConfs covers CSRankings venues and
CORE A\* conferences, not every CS conference.

To request one, open an issue titled `[ADD-CONFERENCE]` containing a YAML block
with the details; a bot turns it into a pull request automatically. The format is
in the [README](README.md#3-adding-a-conference-from-a-github-issue).

---

## Why does a conference show several deadlines?

Some conferences run multiple submission cycles per year (VLDB is monthly, ICSE
and NDSS run two rounds). Those appear as one card with a cycle stepper, each
cycle listing its own deadline and notification date.

---

## Is there an API?

Not officially, but the site is static and its data is plain JSON:

```
https://roars.dev/csconfs/data/conferences.json
```

It is regenerated on every deploy. There is no rate limiting or authentication,
but it is served from GitHub Pages — please be reasonable. For anything
substantial, read
[`conferences.yaml`](public/data/conferences.yaml) from the repository instead.
