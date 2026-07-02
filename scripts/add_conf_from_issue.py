import os
import re
import sys
import yaml

CONFERENCES_FILE = "public/data/conferences.yaml"

def main():
    issue_body = os.getenv("ISSUE_BODY")
    if not issue_body:
        print("Error: ISSUE_BODY environment variable is empty or not set.")
        return 1

    match = re.search(r"```yaml\s*\n(.*?)\n\s*```", issue_body, re.DOTALL)
    if not match:
        match = re.search(r"```yaml\s*(.*?)\s*```", issue_body, re.DOTALL)
        
    if not match:
        print("Error: Could not find any ```yaml ... ``` code block in the issue body.")
        return 1

    yaml_text = match.group(1).strip()
    

    try:
        parsed_data = yaml.safe_load(yaml_text)
    except Exception as e:
        print(f"Error: Failed to parse YAML content. Detail: {e}")
        return 1

    if not isinstance(parsed_data, list) or len(parsed_data) == 0:
        if isinstance(parsed_data, dict):
            new_entry = parsed_data
        else:
            print("Error: Parsed YAML must be a list containing a conference entry or a dictionary.")
            return 1
    else:
        new_entry = parsed_data[0]

    if not isinstance(new_entry, dict):
        print("Error: Parsed entry is not a dictionary.")
        return 1

    required_fields = ["name", "year", "description", "link", "date"]
    missing = [field for field in required_fields if not new_entry.get(field)]
    if missing:
        print(f"Error: The submission is missing required fields: {', '.join(missing)}")
        return 1

    try:
        new_entry["year"] = int(new_entry["year"])
    except ValueError:
        print(f"Error: Year must be a number, got '{new_entry.get('year')}'")
        return 1

    for k, v in list(new_entry.items()):
        if isinstance(v, str) and v.strip().lower() == "null":
            new_entry[k] = None

    if not os.path.exists(CONFERENCES_FILE):
        print(f"Error: Database file not found at {CONFERENCES_FILE}")
        return 1

    try:
        with open(CONFERENCES_FILE, "r") as f:
            current_confs = yaml.safe_load(f) or []
    except Exception as e:
        print(f"Error reading {CONFERENCES_FILE}: {e}")
        return 1

    current_confs.insert(0, new_entry)

    try:
        with open(CONFERENCES_FILE, "w") as f:
            yaml.dump(current_confs, f, default_flow_style=False, allow_unicode=True)
        print(f"Success: Added '{new_entry['name']} {new_entry['year']}' to the database.")
        
        if "GITHUB_OUTPUT" in os.environ:
            with open(os.environ["GITHUB_OUTPUT"], "a") as out:
                out.write(f"conf_name={new_entry['name']}\n")
                out.write(f"conf_year={new_entry['year']}\n")
        return 0
    except Exception as e:
        print(f"Error saving to {CONFERENCES_FILE}: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
