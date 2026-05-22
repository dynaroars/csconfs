import os
import sys
import argparse
import yaml
import requests
from bs4 import BeautifulSoup
from fake_useragent import UserAgent
from dotenv import load_dotenv
import json
import re
import time
import warnings

warnings.filterwarnings("ignore", category=FutureWarning)

# Load environment variables
load_dotenv()

# Support both Groq and Gemini — prefer Groq
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if GROQ_API_KEY:
    LLM_PROVIDER = "groq"
    LLM_MODEL = "llama-3.3-70b-versatile"
    LLM_BASE_URL = "https://api.groq.com/openai/v1/chat/completions"
    LLM_API_KEY = GROQ_API_KEY
    print(f"Using Groq ({LLM_MODEL})")
elif GEMINI_API_KEY:
    LLM_PROVIDER = "gemini"
    LLM_MODEL = "gemini-2.0-flash-lite"
    LLM_API_KEY = GEMINI_API_KEY
    try:
        from google import genai
        USE_NEW_SDK = True
        client = genai.Client(api_key=GEMINI_API_KEY)
    except ImportError:
        import google.generativeai as genai
        USE_NEW_SDK = False
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel(LLM_MODEL)
    print(f"Using Gemini ({LLM_MODEL})")
else:
    print("Error: Set GROQ_API_KEY or GEMINI_API_KEY in .env file.")
    print("Get a free Groq key at https://console.groq.com")
    exit(1)

DATA_FILE = "public/data/conferences.yaml"
OUTPUT_FILE = "suggested_updates_llm.yaml"

# ---------------------------------------------------------------------------
# URL patterns for conferences with predictable yearly domains
# Supports {yyyy} for 4-digit year and {yy} for 2-digit year
# ---------------------------------------------------------------------------
URL_PATTERNS = {
    # --- AI / ML ---
    'AAAI':  ['https://aaai.org/conference/aaai/aaai-{yy}/'],
    'IJCAI': ['https://{yyyy}.ijcai.org/'],
    'ICLR':  ['https://iclr.cc/Conferences/{yyyy}'],
    'ICML':  ['https://icml.cc/Conferences/{yyyy}'],
    'NeurIPS': ['https://neurips.cc/Conferences/{yyyy}'],

    # --- NLP ---
    'ACL':   ['https://{yyyy}.aclweb.org/'],
    'EMNLP': ['https://{yyyy}.emnlp.org/'],
    'NAACL': ['https://{yyyy}.naacl.org/', 'https://naacl.org/{yyyy}/'],

    # --- Vision ---
    'CVPR':  ['https://cvpr.thecvf.com/Conferences/{yyyy}'],
    'ECCV':  ['https://eccv.ecva.net/Conferences/{yyyy}'],
    'ICCV':  ['https://iccv.thecvf.com/Conferences/{yyyy}'],

    # --- PL / SE (sigplan/researchr) ---
    'PLDI':  ['https://pldi{yy}.sigplan.org/'],
    'POPL':  ['https://popl{yy}.sigplan.org/'],
    'ICFP':  ['https://icfp{yy}.sigplan.org/'],
    'OOPSLA': [
        'https://conf.researchr.org/track/splash-{yyyy}/oopsla-{yyyy}',
        'https://{yyyy}.splashcon.org/track/splash-{yyyy}-oopsla',
    ],
    'ICSE':  ['https://conf.researchr.org/home/icse-{yyyy}'],
    'FSE':   ['https://conf.researchr.org/home/fse-{yyyy}'],
    'ASE':   ['https://conf.researchr.org/home/ase-{yyyy}'],
    'ISSTA': ['https://conf.researchr.org/home/issta-{yyyy}'],
    'CAV':   ['https://conferences.i-cav.org/{yyyy}/', 'https://i-cav.org/{yyyy}/'],
    'LICS':  ['https://lics.siglog.org/lics{yy}/'],

    # --- Systems ---
    'OSDI':  ['https://www.usenix.org/conference/osdi{yy}'],
    'SOSP':  ['https://sigops.org/s/conferences/sosp/{yyyy}/'],
    'EuroSys': ['https://{yyyy}.eurosys.org/'],
    'USENIX ATC': ['https://www.usenix.org/conference/atc{yy}'],
    'FAST':  ['https://www.usenix.org/conference/fast{yy}'],
    'NSDI':  ['https://www.usenix.org/conference/nsdi{yy}'],

    # --- Architecture ---
    'ASPLOS': ['https://www.asplos-conference.org/asplos{yyyy}/'],
    'HPCA':  ['https://hpca-conf.org/{yyyy}/'],
    'ISCA':  ['https://iscaconf.org/isca{yyyy}/'],
    'MICRO': ['https://microarch.org/micro{ed}/'],  # Uses edition number, handled specially
    'DAC':   ['https://www.dac.com/'],

    # --- Security ---
    'CCS':   ['https://www.sigsac.org/ccs/CCS{yyyy}/'],
    'NDSS':  ['https://www.ndss-symposium.org/ndss{yyyy}/'],
    'IEEE S&P': ['https://sp{yyyy}.ieee-security.org/'],
    'USENIX Security': ['https://www.usenix.org/conference/usenixsecurity{yy}'],

    # --- Networking ---
    'SIGCOMM': ['https://conferences.sigcomm.org/sigcomm/{yyyy}/'],
    'MobiCom': ['https://www.sigmobile.org/mobicom/{yyyy}/'],

    # --- HCI ---
    'CHI':   ['https://chi{yyyy}.acm.org/'],

    # --- Data ---
    'SIGMOD': ['https://{yyyy}.sigmod.org/'],
    'KDD':   ['https://kdd{yyyy}.kdd.org/'],
    'SIGIR': ['https://sigir-{yyyy}.github.io/', 'https://sigir.org/sigir{yyyy}/'],

    # --- Graphics ---
    'SIGGRAPH': ['https://s{yyyy}.siggraph.org/'],
}


MICRO_EDITION_BASE = 2025 - 58 

def format_pattern(pattern, year):
    """Format a URL pattern with the given year."""
    short_year = str(year)[-2:]
    result = pattern.replace('{yyyy}', str(year)).replace('{yy}', short_year)

    if '{ed}' in result:
        edition = year - MICRO_EDITION_BASE
        result = result.replace('{ed}', str(edition))
    return result

def try_pattern_urls(name, target_year):
    """Try all pattern-based URLs for a conference. Returns first working URL or None."""
    if name not in URL_PATTERNS:
        return None
    
    for pattern in URL_PATTERNS[name]:
        url = format_pattern(pattern, target_year)
        try:
            print(f"  Trying pattern: {url}")
            response = requests.get(url, headers=get_headers(), timeout=12, allow_redirects=True)
            if response.status_code == 200 and len(response.text) > 500:
                return url
            else:
                print(f"  → {response.status_code}" + (f" (too small: {len(response.text)}b)" if response.status_code == 200 else ""))
        except Exception as e:
            print(f"  → Failed: {type(e).__name__}")
    
    return None

def load_conferences():
    with open(DATA_FILE, 'r') as f:
        return yaml.safe_load(f)

def get_headers():
    ua = UserAgent()
    return {'User-Agent': ua.random}

def fetch_html(url):
    try:
        print(f"  Fetching {url}...")
        response = requests.get(url, headers=get_headers(), timeout=15)
        response.raise_for_status()
        return response.text
    except Exception as e:
        print(f"  Failed to fetch {url}: {e}")
        return None

def find_next_year_link(series_url, current_year):
    html = fetch_html(series_url)
    if not html:
        return None
    
    soup = BeautifulSoup(html, 'html.parser')
    next_year = int(current_year) + 1
    short_year = str(next_year)[-2:]
    
    # Unwanted patterns that indicate non-conference pages
    BAD_PATTERNS = [
        'proceeding', 'archive', 'past-conferences',
        '.pdf', '.png', '.jpg', '.jpeg', '.gif',  # File extensions
        'journal', 'submission/', 'volumes-and-issues',  # Journals
        'flyer', 'poster', 'workshop',  # Supporting materials
        '/member', '/login', '/subscribe',  # Admin pages
        'best-', 'review', 'headset', 'product',  # Commercial pages
    ]
    
    # Look for links containing the next year
    for a in soup.find_all('a', href=True):
        text = a.get_text().strip()
        href = a['href'].strip() 
        
        # Skip bad patterns
        if any(pattern in href.lower() for pattern in BAD_PATTERNS):
            continue

        # Check if year is in text or href (full year or short year in href)
        is_match = False
        if str(next_year) in text or str(next_year) in href:
            is_match = True
        elif f"-{short_year}" in href or f"/{short_year}" in href or f"{short_year}.html" in href:
            # Safety check: If we matched a short year (e.g. "27"), 
            # ensure we didn't just match a different 4-digit year (e.g. "2013" in "aaai-27-2013")
            # Regex to find any 4-digit year in the href
            years_in_href = re.findall(r'\d{4}', href)
            if years_in_href:
                # If there are years, and none of them is our target next_year, it's likely an old link
                if str(next_year) not in years_in_href:
                    is_match = False
                else:
                    is_match = True
            else:
                is_match = True
            
        if is_match:
            # Resolve relative URLs
            if not href.startswith('http'):
                from urllib.parse import urljoin
                href = urljoin(series_url, href)
            return href
            
    return None

def call_llm(prompt, max_retries=3):
    """Call LLM (Groq or Gemini) with retry logic for rate limits."""
    for attempt in range(max_retries):
        try:
            if LLM_PROVIDER == "groq":
                response = requests.post(
                    LLM_BASE_URL,
                    headers={
                        "Authorization": f"Bearer {LLM_API_KEY}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": LLM_MODEL,
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.1,
                        "max_tokens": 1024,
                    },
                    timeout=30,
                )
                if response.status_code == 200:
                    return response.json()["choices"][0]["message"]["content"]
                elif response.status_code == 429:
                    retry_after = response.headers.get("retry-after", "10")
                    wait_time = min(float(retry_after) + 2, 65)
                    print(f"  ⏳ Rate limited. Waiting {wait_time:.0f}s (attempt {attempt+1}/{max_retries})...")
                    time.sleep(wait_time)
                    continue
                else:
                    print(f"  LLM error: HTTP {response.status_code} - {response.text[:200]}")
                    return None
            else:
                # Gemini fallback
                if USE_NEW_SDK:
                    response = client.models.generate_content(model=LLM_MODEL, contents=prompt)
                    return response.text
                else:
                    response = model.generate_content(prompt)
                    return response.text
        except Exception as e:
            error_str = str(e)
            if '429' in error_str or 'quota' in error_str.lower() or 'rate' in error_str.lower():
                wait_match = re.search(r'retry in ([\d.]+)s', error_str)
                wait_time = float(wait_match.group(1)) if wait_match else 30
                wait_time = min(wait_time + 5, 65)
                print(f"  ⏳ Rate limited. Waiting {wait_time:.0f}s (attempt {attempt+1}/{max_retries})...")
                time.sleep(wait_time)
            else:
                print(f"  LLM error: {e}")
                return None
    print(f"  ❌ Exhausted retries after rate limiting.")
    return None

def extract_data_with_llm(html_content, conference_name, year):
    print(f"  Asking Gemini to extract data for {conference_name} {year}...")
    
    # Reduce HTML size by keeping only body and stripping scripts/styles
    soup = BeautifulSoup(html_content, 'html.parser')
    for script in soup(["script", "style", "svg", "footer", "nav"]):
        script.decompose()
    text = soup.get_text(separator=' ', strip=True)[:20000] # Limit context window
    
    prompt = f"""
    You are a data extraction assistant. Extract the following details for the conference "{conference_name}" taking place in {year} from the text below.
    
    Return ONLY a valid JSON object with these keys:
    - date: The main conference dates (e.g., "May 15-19, 2026"). Use the format from the page.
    - place: The city and country (e.g., "San Francisco, USA").
    - deadline: The main paper submission deadline (YYYY-MM-DD format if possible).
    - abstract_deadline: The abstract submission deadline (YYYY-MM-DD format if possible).
    - notification_date: The author notification date (YYYY-MM-DD format if possible).
    - general_chair: The general chair name(s), comma-separated if multiple.
    - program_chair: The program chair / PC chair name(s), comma-separated if multiple.
    
    If a field is not found, set it to null. Do NOT guess or hallucinate — only extract what is explicitly stated on the page.
    
    Text:
    {text}
    """
    
    raw = call_llm(prompt)
    if not raw:
        return None
    
    try:
        # Clean up response (remove markdown code blocks if present)
        content = raw.strip()
        if content.startswith("```json"):
            content = content[7:]
        if content.startswith("```"):
            content = content[3:]
        if content.endswith("```"):
            content = content[:-3]
        
        return json.loads(content.strip())
    except Exception as e:
        print(f"  Failed to parse LLM response: {e}")
        print(f"  Raw response: {raw[:200]}")
        return None

def main():
    parser = argparse.ArgumentParser(description='Crawl for new conference editions and extract data with Gemini.')
    parser.add_argument('--confs', type=str, default=None,
                        help='Comma-separated list of conference names to process (e.g., AAAI,IJCAI,PLDI). Default: all.')
    parser.add_argument('--dry-run', action='store_true',
                        help='Only check which URLs exist, skip LLM extraction.')
    args = parser.parse_args()

    target_confs = None
    if args.confs:
        target_confs = set(c.strip() for c in args.confs.split(','))
        print(f"Targeting conferences: {', '.join(sorted(target_confs))}")

    confs = load_conferences()
    suggestions = []
    processed_names = set()

    # Build a set of existing (name, year) pairs to avoid duplicates
    existing_entries = set()
    for conf in confs:
        if isinstance(conf, dict) and conf.get('name') and conf.get('year'):
            existing_entries.add((conf['name'], int(conf['year'])))

    max_year = {}
    for conf in confs:
        if isinstance(conf, dict) and conf.get('name') and conf.get('year'):
            name = conf['name']
            year = int(conf['year'])
            if name not in max_year or year > max_year[name]:
                max_year[name] = year

    conf_info = {}
    for conf in confs:
        if not isinstance(conf, dict):
            continue
        name = conf.get('name')
        year = conf.get('year')
        if not name or not year:
            continue
        if name not in conf_info or int(year) > int(conf_info[name]['year']):
            conf_info[name] = conf

    for name, conf in sorted(conf_info.items()):
        if target_confs and name not in target_confs:
            continue

        year = int(conf['year'])
        series_link = conf.get('series_link')
        next_year = year + 1

        if (name, next_year) in existing_entries:
            print(f"✓ {name} {next_year} already in database")
            continue

        print(f"\n{'='*50}")
        print(f"Processing {name} (current: {year}, looking for: {next_year})")
        print(f"{'='*50}")

        next_url = None


        if name in URL_PATTERNS:
            next_url = try_pattern_urls(name, next_year)
            if next_url:
                print(f"  ✅ Found via pattern: {next_url}")

        
        if not next_url and series_link:
            print(f"  Trying series link: {series_link}")
            next_url = find_next_year_link(series_link, year)
            if next_url:
                print(f"  ✅ Found via series link: {next_url}")

        if not next_url:
            print(f"  ❌ No URL found for {name} {next_year}")
            continue

        if args.dry_run:
            print(f"  [DRY RUN] Would extract data from {next_url}")
            suggestions.append({
                'name': name,
                'description': conf.get('description', ''),
                'year': next_year,
                'link': next_url,
                'deadline': None,
                'abstract_deadline': None,
                'notification_date': None,
                'date': None,
                'place': None,
                'acceptance_rate': None,
                'num_submission': None,
                'general_chair': None,
                'program_chair': None,
            })
            continue

        html = fetch_html(next_url)
        if html:
            data = extract_data_with_llm(html, name, next_year)
            if data:
                print(f"  📋 Extracted: {json.dumps(data, indent=2)}")
                
                description = conf.get('description', '')
                suggestion = {
                    'name': name,
                    'description': description,
                    'year': next_year,
                    'link': next_url,
                    'deadline': data.get('deadline'),
                    'abstract_deadline': data.get('abstract_deadline'),
                    'notification_date': data.get('notification_date'),
                    'date': data.get('date'),
                    'place': data.get('place'),
                    'acceptance_rate': None,
                    'num_submission': None,
                    'general_chair': data.get('general_chair'),
                    'program_chair': data.get('program_chair'),
                }
                suggestions.append(suggestion)
                
            time.sleep(3)
        
    print(f"\n{'='*50}")
    if suggestions:
        print(f"✅ Found {len(suggestions)} suggestion(s). Saving to {OUTPUT_FILE}...")
        with open(OUTPUT_FILE, 'w') as f:
            yaml.dump(suggestions, f, default_flow_style=False, allow_unicode=True)
        print(f"\nReview {OUTPUT_FILE} and manually add approved entries to {DATA_FILE}")
    else:
        print("No new updates found.")

if __name__ == "__main__":
    main()
