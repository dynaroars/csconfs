
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

## 🤖 Automated Conference Crawler

We use an LLM-powered script to automatically find and extract the next year's conference details.

### Prerequisites
1. **Python 3.10+**
2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
3. **Get a Groq API Key**:
   - Get a free key from [Groq](https://console.groq.com).
   - Create a `.env` file in the root directory:
     ```env
     GROQ_API_KEY=your_api_key_here
     ```
   - The script talks to an OpenAI-compatible endpoint over plain HTTP, so you can
     point it at a different provider by setting `LLM_BASE_URL` and `LLM_MODEL`.

### How to Run
```bash
python3 scripts/update_confs_llm.py
```

### Output
- The script looks for `series_link` in `public/data/conferences.yaml`.
- It saves new suggestions to **`suggested_updates_llm.yaml`**.
- **Manual Step**: Review the `suggested_updates_llm.yaml` file and manually copy-paste the correct entries into `public/data/conferences.yaml`. 

### Limitations
Not every conference is covered by this script. Some conferences use inconsistent URL patterns or complex hosting structures that are difficult to crawl automatically.
- See **[`known_crawler_issues.md`](known_crawler_issues.md)** for a list of known exclusions and manual update requirements.
