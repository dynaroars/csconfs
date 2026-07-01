import os
import sys
import yaml
import requests
import argparse

SUGGESTIONS_FILE = "suggested_updates_llm.yaml"

def build_pr_body(suggestions):
    confirmed_suggestions = [item for item in suggestions if not item.get("estimated")]
    
    body = "### Automated Conference Updates!\n\n"
    if not confirmed_suggestions:
        body += "No new confirmed conference editions were found in this run. (Any estimated timeline updates have been merged directly into the database.)\n\n"
        body += "---\n\n"
        body += "*This Pull Request was automatically created by the Conference Crawler GitHub Action.*"
        return body
        
    body += "The automated crawler found and added the following new conference editions to `public/data/conferences.yaml`. Please review the diff and merge this PR if they are correct.\n\n"
    
    # Table header
    body += "| Name | Year | Dates | Location | Main Deadline | Abstract Deadline | Notification | Link |\n"
    body += "| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n"
    
    for item in confirmed_suggestions:
        name = item.get("name", "N/A")
        year = item.get("year", "N/A")
        date = item.get("date") or "—"
        place = item.get("place") or "—"
        deadline = item.get("deadline") or "—"
        abstract = item.get("abstract_deadline") or "—"
        notification = item.get("notification_date") or "—"
        link = item.get("link", "#")
        
        link_str = f"[Link]({link})" if link != "#" else "—"
        
        body += f"| **{name}** | {year} | {date} | {place} | `{deadline}` | `{abstract}` | `{notification}` | {link_str} |\n"
        
    body += "\n---\n\n"
    body += "*This Pull Request was automatically created by the Conference Crawler GitHub Action.*"
    return body

def build_markdown_body(suggestions):
    confirmed_suggestions = [item for item in suggestions if not item.get("estimated")]
    
    body = "### 🔔 New Conferences Found!\n\n"
    if not confirmed_suggestions:
        body += "No new confirmed conference editions were found in this run. (Any estimated timeline updates have been merged directly into the database.)\n\n"
        body += "---\n\n"
        body += "*This issue was automatically created by the Conference Crawler GitHub Action.*"
        return body
        
    body += "The automated crawler found the following new conference editions. Please review them and copy the approved entries into `public/data/conferences.yaml`.\n\n"
    
    # Table header
    body += "| Name | Year | Dates | Location | Main Deadline | Abstract Deadline | Notification | Link |\n"
    body += "| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n"
    
    for item in confirmed_suggestions:
        name = item.get("name", "N/A")
        year = item.get("year", "N/A")
        date = item.get("date") or "—"
        place = item.get("place") or "—"
        deadline = item.get("deadline") or "—"
        abstract = item.get("abstract_deadline") or "—"
        notification = item.get("notification_date") or "—"
        link = item.get("link", "#")
        
        link_str = f"[Link]({link})" if link != "#" else "—"
        
        body += f"| **{name}** | {year} | {date} | {place} | `{deadline}` | `{abstract}` | `{notification}` | {link_str} |\n"
        
    body += "\n---\n\n"
    body += "### 📋 Raw YAML Snippet (Copy & Paste directly into `public/data/conferences.yaml`)\n\n"
    body += "```yaml\n"
    body += yaml.dump(confirmed_suggestions, default_flow_style=False, allow_unicode=True)
    body += "```\n"
    
    body += "\n---\n\n"
    body += "*This issue was automatically created by the Conference Crawler GitHub Action.*"
    return body

def main():
    parser = argparse.ArgumentParser(description="Notify or format conference crawler findings.")
    parser.add_argument('--write-pr-body', type=str, default=None,
                        help="Path to write the PR body markdown, bypassing GitHub issue creation.")
    args = parser.parse_args()

    if not os.path.exists(SUGGESTIONS_FILE):
        print(f"No suggestions file found at {SUGGESTIONS_FILE}. Exiting.")
        return 0
        
    with open(SUGGESTIONS_FILE, "r") as f:
        suggestions = yaml.safe_load(f)
        
    if not suggestions:
        print("Suggestions list is empty. Exiting.")
        return 0
        
    if args.write_pr_body:
        print(f"Writing PR body to {args.write_pr_body}...")
        try:
            with open(args.write_pr_body, "w") as f:
                f.write(build_pr_body(suggestions))
            print("Successfully wrote PR body file.")
            return 0
        except Exception as e:
            print(f"Error writing PR body file: {e}")
            return 1

    print(f"Found {len(suggestions)} suggestions. Creating GitHub Issue...")
    
    # Get GITHUB variables
    repo = os.getenv("GITHUB_REPOSITORY")
    token = os.getenv("GITHUB_TOKEN")
    
    if not repo or not token:
        print("Error: GITHUB_REPOSITORY or GITHUB_TOKEN environment variables not set.")
        # Print markdown to stdout for debugging/manual use
        print("\n--- Generated Markdown Issue Body ---")
        print(build_markdown_body(suggestions))
        return 1
        
    url = f"https://api.github.com/repos/{repo}/issues"
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json"
    }
    
    issue_data = {
        "title": f"🎉 [CONFERENCE CRAWLER] {len(suggestions)} new conference updates found!",
        "body": build_markdown_body(suggestions),
        "labels": ["conference-update"]
    }
    
    response = requests.post(url, json=issue_data, headers=headers)
    if response.status_code == 201:
        print(f"Successfully created issue: {response.json().get('html_url')}")
        return 0
    else:
        print(f"Failed to create issue. HTTP {response.status_code}: {response.text}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
