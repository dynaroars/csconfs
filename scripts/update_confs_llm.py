import os
import yaml
import requests
from bs4 import BeautifulSoup
from fake_useragent import UserAgent
import google.generativeai as genai
from dotenv import load_dotenv
import json
import re
import time

# Load environment variables
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    print("Error: GEMINI_API_KEY not found in .env file.")
    exit(1)

# Configure Gemini
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-2.0-flash')

DATA_FILE = "public/data/conferences.yaml"
OUTPUT_FILE = "suggested_updates_llm.yaml"

# URL patterns for conferences with predictable yearly domains
# Format: conference_name -> pattern with {yy} for 2-digit year
URL_PATTERNS = {
    'POPL': 'https://popl{yy}.sigplan.org/',
    'PLDI': 'https://pldi{yy}.sigplan.org/',
}

def try_pattern_url(name, next_year):
    """Try to construct and verify a pattern-based URL for the next year."""
    if name not in URL_PATTERNS:
        return None
    
    short_year = str(next_year)[-2:]
    url = URL_PATTERNS[name].format(yy=short_year)
    
    try:
        print(f"  Trying pattern URL: {url}")
        response = requests.head(url, headers=get_headers(), timeout=10, allow_redirects=True)
        if response.status_code == 200:
            return url
        else:
            print(f"  Pattern URL returned {response.status_code}")
            return None
    except Exception as e:
        print(f"  Pattern URL failed: {e}")
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
        '/member', '/login', '/subscribe'  # Admin pages
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
    - date: The main conference dates (e.g., "2026-05-15" or "May 15-19, 2026").
    - place: The city and country (e.g., "San Francisco, USA").
    - deadline: The main paper submission deadline (YYYY-MM-DD if possible, otherwise raw string).
    - abstract_deadline: The abstract submission deadline (optional).
    
    If a field is not found, set it to null.
    
    Text:
    {text}
    """
    
    try:
        response = model.generate_content(prompt)
        # Clean up response (remove markdown code blocks if present)
        content = response.text.strip()
        if content.startswith("```json"):
            content = content[7:]
        if content.endswith("```"):
            content = content[:-3]
        
        return json.loads(content)
    except Exception as e:
        print(f"  LLM Extraction failed: {e}")
        return None

def main():
    confs = load_conferences()
    suggestions = []
    processed_names = set()

    for conf in confs:
        if not isinstance(conf, dict): continue
        
        name = conf.get('name')
        series_link = conf.get('series_link')
        year = conf.get('year')
        
        # Only process if we have a series link and haven't processed this conf yet
        if not series_link or name in processed_names:
            continue
            
        processed_names.add(name)
        print(f"Processing {name}...")
        
        # 1. Find next year's URL
        next_year = int(year) + 1
        next_url = find_next_year_link(series_link, year)
        
        if next_url:
            print(f"  Found next URL: {next_url}")
            
            # 2. Fetch content
            html = fetch_html(next_url)
            if html:
                data = extract_data_with_llm(html, name, next_year)
                if data:
                    print(f"  Extracted: {data}")
                    
                    # Get description from the current entry
                    description = conf.get('description', '')
                    
                    # Flatten to match conferences.yaml format
                    suggestion = {
                        'name': name,
                        'description': description,
                        'year': next_year,
                        'link': next_url,
                        'deadline': data.get('deadline'),
                        'abstract_deadline': data.get('abstract_deadline'),
                        'notification_date': None,
                        'date': data.get('date'),
                        'place': data.get('place'),
                        'acceptance_rate': None,
                        'num_submission': None,
                        'general_chair': None,
                        'program_chair': None
                    }
                    suggestions.append(suggestion)
                    
                # Sleep to avoid rate limits
                time.sleep(2)
        else:
            # Try pattern-based URL fallback for conferences with predictable domains
            next_url = try_pattern_url(name, next_year)
            if next_url:
                print(f"  Found via pattern: {next_url}")
                html = fetch_html(next_url)
                if html:
                    data = extract_data_with_llm(html, name, next_year)
                    if data:
                        print(f"  Extracted: {data}")
                        description = conf.get('description', '')
                        suggestion = {
                            'name': name,
                            'description': description,
                            'year': next_year,
                            'link': next_url,
                            'deadline': data.get('deadline'),
                            'abstract_deadline': data.get('abstract_deadline'),
                            'notification_date': None,
                            'date': data.get('date'),
                            'place': data.get('place'),
                            'acceptance_rate': None,
                            'num_submission': None,
                            'general_chair': None,
                            'program_chair': None
                        }
                        suggestions.append(suggestion)
                    time.sleep(2)
            else:
                print(f"  Could not find link for {next_year} on {series_link}")

    # Save suggestions
    if suggestions:
        print(f"Found {len(suggestions)} suggestions. Saving to {OUTPUT_FILE}...")
        with open(OUTPUT_FILE, 'w') as f:
            yaml.dump(suggestions, f)
    else:
        print("No new updates found.")

if __name__ == "__main__":
    main()
