# Updating conference chairs/place/dates — reusable playbook

This is a runbook for the task "go find missing general_chair / program_chair /
place / date info for conference X (or a whole subfield) and fill in
`public/data/conferences.yaml`". It's not automated by any script — CCFDDL
sync only touches dates and acceptance rates, `update_confs_llm.py` only
scrapes for the *next* edition of a conference already at its latest known
year. Chairs and venues for editions beyond that require this manual
web-research workflow. It was worked out by trial and error; follow it as-is
rather than re-deriving the approach each time.

## 1. Trigger phrases

Any of these should invoke this playbook:

- "Update conference metadata for `<SCOPE>`"
- "Fill in missing chairs/place for `<SCOPE>`"
- "Do the same conference-update thing for `<SCOPE>`"

Where `<SCOPE>` is one of:
- A CSRankings **parent area**: `AI`, `Systems`, `Theory`, `Interdisciplinary Areas`
- A CSRankings **subfield**: e.g. `Programming languages`, `Computer security`
- An explicit list of conference acronyms: e.g. `ICSE, FSE, ASE`
- `all` — every tracked conference (large; expect 10+ agents, see §4)

## 2. Find the scope's conferences

```bash
python3 -c "
import yaml, csv
data = yaml.safe_load(open('public/data/conferences.yaml'))
rows = list(csv.DictReader(open('public/data/csrankings_conferences.csv')))
area_of = {r['ConferenceTitle'].lower(): (r['ParentArea'], r['AreaTitle']) for r in rows}
names = sorted(set(c['name'].lower() for c in data))
for n in names:
    print(n, area_of.get(n, ('?', '?')))
"
```

This gives you `(name, (ParentArea, AreaTitle))` for every tracked conference
— filter to the requested scope by ParentArea or AreaTitle. Note: a handful
of tracked conferences (e.g. `cgo`) aren't in `csrankings_conferences.csv` at
all — they're CORE-only or untracked by CSRankings; still fine to include if
in scope.

## 3. Find what's actually missing

```bash
python3 -c "
import yaml
data = yaml.safe_load(open('public/data/conferences.yaml'))
targets = {<lowercase names from step 2>}
rows = [c for c in data if c.get('name','').lower() in targets and c.get('year',0) >= 2025]
rows.sort(key=lambda c: (c['name'], c['year']))
for c in rows:
    missing = [k for k in ('place','general_chair','program_chair') if not c.get(k)]
    if missing:
        print(f\"{c['name']:16} {c['year']} note={c.get('note')} missing={missing}\")
"
```

**Restrict to `year >= <current year>`** by default (recent + upcoming
editions). Older years are historical backfill — only chase them if the user
explicitly asks, since the ROI is much lower and sourcing gets harder
(committee pages disappear, only DBLP/ACM-DL proceedings-editor lists survive,
which don't reliably distinguish general vs. program chair).

**Collapse multi-cycle conferences.** ASPLOS, CCS, IEEE S&P, SIGMOD, PODS,
VLDB, NSDI, FAST, USENIX Security, MobiCom, OOPSLA, ISSTA, ICSE etc. run
multiple submission cycles per year (`note: Cycle 1/2`, `1/12`, etc.) that all
share the same chairs. Research **one answer per (conference, year)**, then
apply it to every cycle row for that year — don't make an agent re-research
per cycle.

## 4. Spawn research agents — clustered, not one-per-conference

One agent per conference is wasteful; one giant agent for everything runs out
of focus. Cluster **4-6 related conference series per agent**, grouped by
subfield (matches how CSRankings already buckets them — architecture,
networks, security, databases, EDA/embedded, HPC/measurement, OS, AI/vision,
ML, NLP/IR, theory, bio/econ/csed, graphics/viz, HCI/robotics). For `all`
scope this is roughly 12-15 agents.

Each agent must be `general-purpose`, **research-only**, and get this exact
brief (fill in the bracketed parts):

```
Research-only task (do not edit any files, do not write code, do not use git).
I'm gathering facts to manually update a YAML database of CS conference
metadata at /home/tnguyen/git/projects/csconfs/public/data/conferences.yaml.
You do not need to read that file — I'm giving you the exact gaps below.

For each conference+year listed, find these fields if currently
missing/unpublished: general_chair (name(s)), program_chair (name(s)), place
(city/venue). Use WebSearch/WebFetch. Prefer OFFICIAL sources only: the
conference's own site, conf.researchr.org series/committee pages, the
sponsoring society's site (sigplan.org, sigmod.org, usenix.org, acm.org,
ieee.org, iacr.org, etc.), or ACM/IEEE proceedings front matter. Do NOT use
personal CVs, aggregator sites (wikicfp, conferencelists.org), or unofficial
blogs as a source — if the only thing you find is unofficial, report "NOT
FOUND (unofficial only)" rather than treating it as confirmed. If an edition
isn't announced yet, say so plainly — never guess or infer a name.

Note: [conference] runs [N] submission cycles per year sharing the same
chairs — you only need one answer per year, not per cycle. [omit if N/A]

Targets (conference: years needing chairs/place):
- [CONF]: [years] ([which fields, if not all three])
- ...

Report back ONLY in this exact structured format, one block per fact found
(state "NOT FOUND" explicitly for anything you looked for but couldn't
confirm — do not omit silently):

CONF: <name>
YEAR: <year>
FIELD: <place|general_chair|program_chair|date>
VALUE: <value>
SOURCE: <url>

Keep prose outside the blocks under 250 words. Do not edit any files.
```

Launch all of a batch's agents **in one message** (parallel tool calls), not
sequentially — they don't share state and don't touch the same file, so
there's no coordination cost to parallelizing.

**Rate limits:** each agent burns real session budget (WebSearch + WebFetch
calls add up fast — 15-40 tool calls per agent is typical). Spawning 12-15 at
once is a lot of simultaneous load; if the session is already well into its
usage window, consider batching in two waves of ~6-7 rather than one wave of
14, or just launch and be ready to retry the ones that fail with a rate-limit
error message (the failure notification names a reset time — don't retry
before then).

## 5. Apply the results yourself — don't let agents write the YAML

Agents run in parallel and would race on the same file if they edited it
directly, so they only report; you apply. Do it as one Python round-trip per
batch of results (not one Edit-tool call per field — too slow and error-prone
for dozens of fields):

```python
import yaml
path = "public/data/conferences.yaml"
data = yaml.safe_load(open(path))

def find(name, year, note=None):
    return [c for c in data if c.get('name','').lower()==name.lower()
            and c.get('year')==year and (note is None or c.get('note')==note)]

updates = [
    # (name, year, note_or_None, field, value)
    ('SIGMOD', 2025, None, 'general_chair', '...'),
    # note=None applies to ALL cycle-rows for that (name, year) — this is how
    # you fan a single chair answer out across every "Cycle k/n" duplicate.
]

for name, year, note, field, value in updates:
    for c in find(name, year, note):
        c[field] = value

with open(path, 'w') as f:
    yaml.dump(data, f, default_flow_style=False, allow_unicode=True)
```

This preserves the file's existing style (alphabetical keys, same quoting) —
it's the same dump call `scripts/sync_ccfddl.py` uses, so the diff stays
clean and consistent with prior automated edits.

**Rules for what to write:**
- Only fill fields that are currently `null` — never overwrite an existing
  value.
- Only write facts with a solid primary source (official conference/society
  page). Skip anything the agent flagged as CV-only, aggregator-only, or
  otherwise unofficial — leave those fields `null` and mention them to the
  user as "found but unconfirmed" instead of writing them.
- If an agent reports a real confirmed date/venue that contradicts a
  placeholder (`estimated: true` entries carry last year's date shifted
  forward), update `date`/`place` but leave `estimated: true` alone unless the
  *deadline* itself is now confirmed too — `estimated` describes deadline
  confidence, not chair/venue confidence.
- Never invent a general_chair when only a program_chair was found, or vice
  versa — some conferences genuinely don't have both roles in a given year.

## 6. Verify

```bash
git diff --stat public/data/conferences.yaml   # should be all-single-field-line changes, no reformatting noise
python3 check-name.py                           # unrelated but cheap sanity check
node -e "require('js-yaml').load(require('fs').readFileSync('public/data/conferences.yaml','utf8')); console.log('yaml OK')"
```

Skim the diff — every changed line should be a `field: null` → `field: value`
swap. If `yaml.dump` reformatted unrelated lines (quote style, key order),
something upstream is malformed; investigate before trusting the diff.

## 7. Report back to the user

Summarize: what got filled in (grouped by conference), and — just as
importantly — what's still genuinely unknown because it hasn't been
announced yet (don't bury this; it's useful signal, not a failure). Note any
agent that hit a rate limit or came back empty so a retry can be scoped
precisely instead of re-running the whole batch.
