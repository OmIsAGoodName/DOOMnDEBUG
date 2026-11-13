"""
VoxFable Team Status & Sync Tracker.
Reads docs/status/{om,maegan,nigel}.md and reports consolidated progress.
"""

import re
import os
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
STATUS_DIR = ROOT / "docs" / "status"

def parse_status_file(path: Path) -> dict:
    if not path.exists():
        return {}
    sections = {}
    current_sec = "header"
    sections[current_sec] = []

    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line_str = line.strip()
            if line_str.startswith("## "):
                raw_sec = line_str.replace("## ", "").strip().lower()
                clean_sec = re.sub(r"^\d+\.\s*", "", raw_sec)
                current_sec = clean_sec
                sections[current_sec] = []
            elif line_str.startswith("# "):
                pass
            else:
                if line_str:
                    sections[current_sec].append(line_str)
    return sections

def print_member_summary(name: str, data: dict):
    print(f"\n[{name.upper()}]")
    done = [x for x in data.get("done", []) if x and x != "-"]
    in_progress = [x for x in data.get("in progress", []) if x and x != "-"]
    blockers = [x for x in data.get("blockers", []) if x and x != "-"]
    requests = [x for x in data.get("requests", []) + data.get("requests / notes for team", []) if x and x != "-"]
    proposals = [x for x in data.get("contract proposals", []) if x and x != "-"]

    print(f"  * Done:        {len(done)} item(s)")
    for d in done[:3]:
        print(f"      - {d}")
    if len(done) > 3:
        print(f"      ... (+{len(done)-3} more)")

    print(f"  * In Progress: {', '.join(in_progress) if in_progress else 'None specified'}")
    if blockers:
        print(f"  * BLOCKERS:    \033[91m{', '.join(blockers)}\033[0m")
    if requests:
        print(f"  * Requests:    {', '.join(requests)}")
    if proposals:
        print(f"  * Proposals:   \033[93m{', '.join(proposals)}\033[0m")

def main():
    print("========================================")
    print("      VOXFABLE TEAM SYNC MONITOR        ")
    print("========================================")

    # Check git remote status
    try:
        subprocess.run(["git", "fetch", "origin"], check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        branches = subprocess.getoutput("git branch -r")
        print("\nActive Remote Branches:")
        for b in branches.splitlines():
            print(f"  {b.strip()}")
    except Exception:
        pass

    members = ["om", "maegan", "nigel"]
    for m in members:
        fpath = STATUS_DIR / f"{m}.md"
        data = parse_status_file(fpath)
        print_member_summary(m, data)

    print("\n========================================")

if __name__ == "__main__":
    main()
