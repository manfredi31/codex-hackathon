---
name: codex-skill-exporter
description: Copy Codex skills from ~/.codex/skills into the current project so they can be committed to GitHub. Use when asked to export, sync, or vendor Codex skills, including options to exclude .system skills, filter specific skills, or run a dry-run.
---

# Codex Skill Exporter

## Overview
Use the bundled script to copy skill folders from a source directory into a destination repo. Default behavior: source `~/.codex/skills`, destination is the current working directory, exclude `.system`, and skip existing folders.

## Quick Start
Run from the destination repo root:

```bash
python codex-skill-exporter/scripts/copy_skills.py
```

Run from anywhere by setting the destination explicitly:

```bash
python /path/to/codex-skill-exporter/scripts/copy_skills.py --dest /path/to/repo
```

## Common Options
- `--include-system` to copy `.system`
- `--only name1,name2` to copy only specified skills
- `--exclude name1,name2` to skip specified skills
- `--dry-run` to print actions without copying
- `--overwrite` to replace existing destination folders

## Notes
- Keep destination clean; the script skips existing directories unless `--overwrite` is set.
- The script ignores `__pycache__`, `*.pyc`, `.DS_Store`, and `.git` while copying.
