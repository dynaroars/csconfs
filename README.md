
# 📅 CS Conference Deadlines
**CSConfs** is open-source app for tracking **Computer Science conference deadlines**, **notifications**, **locations**, and more! CSConfs uses conferences defined by [CSRankings](https://csrankings.org/) and [CORE](https://portal.core.edu.au/conf-ranks/) (A*). Enjoy tracking your favorite CS conferences! 


---

## 🌐 Live Site

Visit here 👉 [https://roars.dev/csconfs/](https://roars.dev/csconfs/)

---

## 📂 Project Structure

- **Open**: This project is open-source on [**GitHub**](https://code.roars.dev/csconfs).  
- **Tech stuff**: This website is built using **Vite** and **React**. It is a **static site** hosted through **Github Pages**.
- **Data:** Main database is stored in the file [`public/data/conferences.yaml`](https://github.com/dynaroars/csconfs/blob/main/public/data/conferences.yaml). At build time `scripts/build-data.js` converts it — along with the ranking and acceptance-rate CSVs in the same directory — into the JSON the site actually loads. The generated `public/data/*.json` files are git-ignored, so **always edit the YAML/CSV sources**, never the JSON. A malformed edit fails the build rather than the live site.

---

## 🤝 Contributions

We welcome contributions! 

### How to contribute:

You can help **check**, **add**, or **fix** inconsistencies about the conferences in the `public/data/conferences.yaml` file. Use the existing entries in that file as examples to maintain formatting and consistency.


1. **Fork** the repository.
1. **Clone** your forked repository to your local machine.
1. Make your changes in the [`public/data/conferences.yaml`](https://github.com/dynaroars/csconfs/blob/main/public/data/conferences.yaml) file.
1. Save and **Test** your changes locally (see below).
1. **Commit** and **Push** your changes with a clear message.
1. Create a **pull request** to the [original repository](https://git.roars.dev/csconfs).
1. If you have questions or comments, feel free to open a [Github issue](https://github.com/dynaroars/csconfs/issues).

---

## 🧪 To Test Locally

1. **Install dependencies**:

```bash
# Check versions:
node -v  # v23.11.0 (on my Mac OS)
npm -v   # 11.3.0 (on my Mac OS)

# In the project root, e.g., ~/git/csconfs/ 
npm install
```

2. **Run the local server**:

```bash
npm run dev
```

3. **View in browser**:

```bash
http://localhost:5173/
```

- The dev server regenerates the JSON whenever you edit a file in `public/data/` and reloads the page.
- If there are any errors, check and fix your edits in the `public/data/conferences.yaml` file — the terminal reports the parse error.

4. **Stop the server**:

```bash
# Press Ctrl + C in the terminal
```

---

## 🚀 Deploy to GitHub Pages

Deployment is automatic: every push to `main` triggers
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml), which builds the
site and publishes it to GitHub Pages. There is nothing to run by hand.

To check a production build locally first:

```bash
npm run build
npm run preview
```

---

## 🔄 Refreshing acceptance-rate data

Acceptance rates come from
[emeryberger/csconferences](https://github.com/emeryberger/csconferences) and are
vendored at `public/data/acceptance_rates.csv` so the site never depends on a
third-party host at page load. To pull the latest copy:

```bash
npm run sync:acceptance
```

---


Created by [Roars Lab](https://roars.dev)  

---

## 🤖 Automatic Data Updates

Conference dates are kept current automatically, with no API key and no LLM in
the loop.

[`.github/workflows/sync_data.yml`](.github/workflows/sync_data.yml) runs every
Monday (and on demand from the Actions tab). It syncs
`public/data/conferences.yaml` against the community-maintained
[CCFDDL](https://github.com/ccfddl/ccf-deadlines) database, which covers 72 of
the 73 conferences we track. If anything changed it commits straight to `main`
and redeploys — there is no pull request to review or merge.

`scripts/sync_ccfddl.py` only rewrites an entry when CCFDDL confirms it:

- a date matching CCFDDL gains `verified: true`
- an `estimated` entry whose date CCFDDL contradicts is corrected and promoted
- anything CCFDDL does not cover keeps its `estimated` flag, so the site keeps
  badging it as a guess behind the "Show Estimated" toggle

To preview what it would change without writing anything:

```bash
pip install -r requirements.txt
python3 scripts/sync_ccfddl.py            # dry run
python3 scripts/sync_ccfddl.py --apply    # write the changes
```

---

## 🕷️ LLM Crawler (manual, optional)

For the rare conference CCFDDL does not cover, or an edition it has not listed
yet, `scripts/update_confs_llm.py` crawls conference sites and extracts details
with an LLM. It is **not** part of any workflow — run it by hand when you need it.

```bash
# .env needs GROQ_API_KEY (free key at https://console.groq.com).
# Any OpenAI-compatible endpoint works via LLM_BASE_URL / LLM_MODEL.
python3 scripts/update_confs_llm.py                  # writes suggested_updates_llm.yaml
python3 scripts/update_confs_llm.py --confs ICSE,ASE # limit to some conferences
python3 scripts/update_confs_llm.py --dry-run        # only check which URLs exist
```

Review `suggested_updates_llm.yaml` and copy the entries you trust into
`public/data/conferences.yaml`. Where a conference is in CCFDDL, the crawler
cross-checks its extraction against it and prefers the CCFDDL date.

### Limitations
Not every conference is covered. Some use inconsistent URL patterns or complex
hosting that is difficult to crawl automatically.
- See **[`known_crawler_issues.md`](known_crawler_issues.md)** for known exclusions and manual update requirements.
