
# 📅 CS Conference Deadlines
**CSConfs** is open-source app for tracking **Computer Science conference deadlines**, **notifications**, **locations**, and more! CSConfs uses conferences defined by [CSRankings](https://csrankings.org/) and [CORE](https://portal.core.edu.au/conf-ranks/) (A*). Enjoy tracking your favorite CS conferences! 


---

## 🌐 Live Site

Visit here 👉 [https://roars.dev/csconfs/](https://roars.dev/csconfs/)

---

## 📂 Project Structure

- **Open**: This project is open-source on [**GitHub**](https://code.roars.dev/csconfs).  
- **Tech stuff**: This website is built using **Vite** and **React**. It is a **static site** that fetches data from a **YAML** file and is hosted through **Github Pages**.
- **Data:** Main database is stored in the file [`public/data/conferences.yaml`](https://github.com/dynaroars/csconfs/blob/main/public/data/conferences.yaml).

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
http://localhost:3000/
```

- If there are any errors, check and fix your edits in the `public/data/conferences.yaml` file.

4. **Stop the server**:

```bash
# Press Ctrl + C in the terminal
```



---

## 🚀 Deploy to GitHub Pages
> Deploy to `roars.dev/csconfs` (only for maintainers):

```bash
# In the project root, e.g., ~/git/csconfs/ and in the `main``
npm run build
```

  - The script handles deployment to the `gh-pages` branch. It will automatically build the project and push the changes to the `gh-pages` branch. So you don't need to push to the `gh-pages` branch manually.

---


Created by [Roars Lab](https://roars.dev)  

---

## 🤖 Automated Conference Crawler

We use an LLM-powered script to automatically find and extract the next year's conference details.

### Prerequisites
1. **Python 3.10+**
2. **Install dependencies**:
   ```bash
   pip install requests beautifulsoup4 fake-useragent google-generativeai python-dotenv pyyaml
   ```
3. **Get a Gemini API Key**:
   - Get a free key from [Google AI Studio](https://aistudio.google.com/).
   - Create a `.env` file in the root directory:
     ```env
     GEMINI_API_KEY=your_api_key_here
     ```

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
