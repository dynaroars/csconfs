# 📅 CS Conference Deadlines

**CSConfs** is an open-source app for tracking **Computer Science conference deadlines**, **notifications**, **locations**, and more. It covers the conferences defined by [CSRankings](https://csrankings.org/) and [CORE](https://portal.core.edu.au/conf-ranks/) (A\*).

**Live site 👉 [roars.dev/csconfs](https://roars.dev/csconfs/)**

---

## Contents

- [How it works](#how-it-works)
- [Updating conference data](#updating-conference-data)
  - [Automatic weekly sync](#1-automatic-weekly-sync-no-action-needed)
  - [Editing by hand](#2-editing-by-hand)
  - [Adding a conference from a GitHub issue](#3-adding-a-conference-from-a-github-issue)
  - [The LLM crawler](#4-the-llm-crawler-manual-optional)
  - [Refreshing acceptance rates](#5-refreshing-acceptance-rates)
- [Conference entry reference](#conference-entry-reference)
- [Local development](#local-development)
- [Deployment](#deployment)
- [Repository layout](#repository-layout)
- [Contributing](#contributing)
- [FAQ & data sources](FAQ.md)

---

## How it works

A **static site** built with **Vite** and **React**, hosted on **GitHub Pages**. There is no backend and no database server.

The source of truth is [`public/data/conferences.yaml`](public/data/conferences.yaml) — about 1000 conference-year entries, hand-editable. Alongside it live three CSVs: the CSRankings and CORE conference lists, and vendored acceptance-rate data.

At build time, [`scripts/build-data.js`](scripts/build-data.js) (a Vite plugin) converts all of them into the JSON the browser actually fetches:

```
public/data/conferences.yaml            ──┐
public/data/csrankings_conferences.csv  ──┤   scripts/     ┌── data/conferences.json
public/data/core_conferences.csv        ──┼─► build-data ─►├── data/csrankings.json
public/data/acceptance_rates.csv        ──┘     .js        ├── data/core.json
                                                           └── data/acceptance_rates.json
```

Three consequences worth knowing:

- **Always edit the YAML/CSV sources, never the JSON.** The generated `public/data/*.json` files are git-ignored and rewritten on every build.
- **A malformed edit fails the build, not the live site.** The deploy stops and the previous version stays up.
- **The YAML and CSVs are not published.** They are stripped from `dist`, so the deployed site serves only JSON. The sources remain readable on GitHub.

---

## Updating conference data

### 1. Automatic weekly sync (no action needed)

[`.github/workflows/sync_data.yml`](.github/workflows/sync_data.yml) runs every **Monday at 07:00 UTC**, and on demand from the Actions tab. **No API key and no LLM are involved.**

It syncs `conferences.yaml` against the community-maintained [CCFDDL](https://github.com/ccfddl/ccf-deadlines) database, which covers **66 of the 73** conferences tracked here. If anything changed it commits straight to `main` and redeploys — **there is no pull request to review or merge**.

[`scripts/sync_ccfddl.py`](scripts/sync_ccfddl.py) is conservative: it only rewrites an entry that CCFDDL confirms.

| Situation | Result |
| :--- | :--- |
| Local date matches CCFDDL | gains `verified: true` |
| `estimated` entry contradicted by CCFDDL | corrected, `estimated` dropped, `verified: true` added |
| Conference/year not in CCFDDL | left alone, keeps its `estimated` flag |

So an unconfirmed date stays badged as a guess in the UI, behind the **Show Estimated** toggle.

Run it yourself:

```bash
pip install -r requirements.txt
python3 scripts/sync_ccfddl.py            # dry run — reports what would change
python3 scripts/sync_ccfddl.py --apply    # write the changes
python3 scripts/sync_ccfddl.py --apply --year 2025   # only audit 2025 onward
```

> **Checking a run actually worked:** a green workflow means the *sync* succeeded. To confirm the site updated, check the live data rather than the checkmark:
> ```bash
> curl -s https://roars.dev/csconfs/data/conferences.json | head -c 200
> ```

### 2. Editing by hand

For anything CCFDDL does not cover, edit [`public/data/conferences.yaml`](public/data/conferences.yaml) directly. Copy a nearby entry as a template and keep keys alphabetical.

```bash
npm run dev     # regenerates JSON on save and reloads; parse errors print in the terminal
```

Push to `main` (maintainers) or open a pull request (everyone else). The deploy runs itself.

### 3. Adding a conference from a GitHub issue

Open an issue titled `[ADD-CONFERENCE] ...`, or add the `add-conference` label to an existing one, with a YAML block in the body:

````markdown
```yaml
- name: FSE
  year: 2028
  description: ACM International Conference on the Foundations of Software Engineering
  link: https://conf.researchr.org/home/fse-2028
  deadline: '2027-09-10'
  place: TBD
```
````

[`process_submission.yml`](.github/workflows/process_submission.yml) parses the block, prepends it to `conferences.yaml`, opens a PR, and comments the PR link back on the issue. This one **does** need review and merging.

### 4. The LLM crawler (manual, optional)

For a conference CCFDDL does not cover, or an edition it has not listed yet, [`scripts/update_confs_llm.py`](scripts/update_confs_llm.py) crawls conference websites and extracts details with an LLM. **It is not part of any workflow** — run it by hand when you need it.

Setup — create a `.env` in the project root:

```env
GROQ_API_KEY=your_api_key_here
```

Get a free key at [console.groq.com](https://console.groq.com). The script calls an OpenAI-compatible endpoint over plain HTTP with no vendor SDK, so you can point it anywhere:

```env
LLM_BASE_URL=https://api.openai.com/v1/chat/completions
LLM_MODEL=gpt-4o-mini
```

Usage:

```bash
python3 scripts/update_confs_llm.py                   # all conferences → suggested_updates_llm.yaml
python3 scripts/update_confs_llm.py --confs ICSE,ASE  # just these
python3 scripts/update_confs_llm.py --dry-run         # only check which URLs resolve, no LLM calls
python3 scripts/update_confs_llm.py --auto-merge      # write straight into conferences.yaml
```

How it finds each next edition: it takes the newest **confirmed** year per conference, targets `year + 1`, and tries a hardcoded URL pattern (about 45 conferences) before falling back to following `series_link`. A candidate URL must return HTTP 200, be over 500 bytes, not be a login/error page, and not redirect to a different year. If nothing resolves, it synthesises an `estimated: true` entry by shifting last year's dates forward. Where CCFDDL has the conference, the extraction is cross-checked and **CCFDDL wins**.

Without `--auto-merge`, review `suggested_updates_llm.yaml` and copy across the entries you trust.

**Limitations:** some conferences use inconsistent URL patterns or hosting that resists crawling. See [`known_crawler_issues.md`](known_crawler_issues.md).

### 5. Refreshing acceptance rates

Acceptance rates come from [emeryberger/csconferences](https://github.com/emeryberger/csconferences) and are **vendored** at `public/data/acceptance_rates.csv`, so page loads never depend on a third-party host:

```bash
npm run sync:acceptance
```

---

## Conference entry reference

One list entry per conference-year, keys alphabetical:

```yaml
- abstract_deadline: '2026-12-01'
  acceptance_rate: null
  date: July 7–9, 2027
  deadline: '2026-12-08'
  description: USENIX Symposium on Operating Systems Design and Implementation
  general_chair: null
  link: https://www.usenix.org/conference/osdi27
  name: OSDI
  notification_date: '2027-03-16'
  num_submission: null
  place: Baltimore, MD, USA
  program_chair: Philip Levis, Junfeng Yang
  series_link: https://osdi.org/
  verified: true
  year: 2027
```

| Field | Notes |
| :--- | :--- |
| `name` | Conference acronym. Must match the CSRankings/CORE CSV spelling or the sidebar filter will not find it — check with `python3 check-name.py`. |
| `year` | Edition year, integer. `name` + `year` is the identity of an entry. |
| `deadline` | Main submission deadline, `'YYYY-MM-DD'`. Interpreted as AoE. |
| `abstract_deadline` | Abstract deadline, same format. |
| `notification_date` | Acceptance notification date. |
| `rebuttal_date` | Optional rebuttal period start. |
| `date` | Conference dates. Free text (`July 7–9, 2027`) or ISO — both are parsed. |
| `place` | City, region, country. |
| `link` | This edition's website. |
| `series_link` | Stable series homepage. Used by the crawler to discover the next edition; not shown in the UI. |
| `description` | Full conference name. |
| `general_chair`, `program_chair` | Comma-separated names. |
| `acceptance_rate`, `num_submission` | Filled from the acceptance-rate CSV when left `null`. |
| `verified` | Cross-checked against CCFDDL. |
| `estimated` | Dates are a guess extrapolated from a previous year. The UI badges these and the **Show Estimated** toggle hides them. |
| `note` | Short label shown on the card (e.g. `Cycle 1`). |
| `rolling_deadline` | For conferences with monthly cycles (VLDB). Expanded into one entry per cycle at load time. |

<details>
<summary><code>rolling_deadline</code> example</summary>

```yaml
  rolling_deadline:
    start: '2025-04-01'            # first cycle's deadline
    end: '2026-03-01'              # last cycle's deadline
    submission_day: 1              # day of month each cycle closes
    notification_day: 15           # day of month notifications go out
    notification_month_offset: 1   # months from submission to notification
```

</details>

---

## Local development

Requires **Node 20+**.

```bash
npm install
npm run dev          # http://localhost:5173/csconfs/
```

The dev server regenerates the JSON whenever you edit anything in `public/data/` and reloads the page. YAML parse errors are printed to the terminal without killing the server.

| Command | What it does |
| :--- | :--- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run sync:acceptance` | Re-download the acceptance-rate CSV |
| `python3 check-name.py` | List conference names missing from the CSRankings/CORE lists — catches typos in `name` |

Python scripts need `pip install -r requirements.txt` (Python 3.10+).

---

## Deployment

Automatic. Every push to `main` triggers [`deploy.yml`](.github/workflows/deploy.yml), which builds the site and publishes it to GitHub Pages. **Nothing to run by hand**, and no `gh-pages` branch is involved — Pages is configured with **Source: GitHub Actions**.

To check a production build first:

```bash
npm run build && npm run preview
```

> **Maintainer note:** a push made by a workflow using the default `GITHUB_TOKEN` does *not* trigger other workflows. That is why `sync_data.yml` calls `deploy.yml` explicitly instead of relying on its push trigger, and why `deploy.yml` checks out `github.ref_name` rather than the run's `github.sha` — otherwise it would build the commit from *before* the sync and publish stale data while reporting success.

---

## Repository layout

```
public/data/          conference database (YAML + CSV sources)
scripts/build-data.js Vite plugin: YAML/CSV → JSON at build time
scripts/sync_ccfddl.py      CCFDDL sync (runs weekly in CI)
scripts/update_confs_llm.py LLM crawler (manual)
scripts/add_conf_from_issue.py  parses [ADD-CONFERENCE] issues
scripts/notify_updates.py       builds PR descriptions
src/                  React app
  components/Calendar/  calendar view
  components/Stat.jsx   statistics view (lazy-loaded)
  components/Graph.jsx  timeline view (lazy-loaded)
check-name.py         name consistency check
requirements.txt      Python dependencies
```

---

## Contributing

Contributions are welcome — checking, adding, and fixing conference details is the most useful thing you can do.

1. **Fork** the repository and **clone** your fork.
2. Edit [`public/data/conferences.yaml`](public/data/conferences.yaml), following the [entry reference](#conference-entry-reference).
3. Test locally with `npm run dev`.
4. **Commit**, **push**, and open a **pull request**.

Questions or corrections you would rather not make yourself? Open a [GitHub issue](https://github.com/dynaroars/csconfs/issues).

---

Created by [Roars Lab](https://roars.dev). Data sources and credits are listed in the [FAQ](FAQ.md).
