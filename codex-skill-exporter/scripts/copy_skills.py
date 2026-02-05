#!/usr/bin/env python3
"""
Copy Codex skills from a source directory into a destination directory.
"""

from __future__ import annotations

import argparse
import os
import shutil
from pathlib import Path
from typing import Iterable, List, Set


IGNORE_PATTERNS = ("__pycache__", "*.pyc", ".DS_Store", ".git")


def _parse_list(values: Iterable[str]) -> List[str]:
    items: List[str] = []
    for value in values:
        for part in value.split(","):
            part = part.strip()
            if part:
                items.append(part)
    return items


def _format_list(items: Iterable[str]) -> str:
    items = list(items)
    return ", ".join(sorted(items)) if items else "(none)"


def _is_hidden(name: str) -> bool:
    return name.startswith(".")


def copy_skill_dir(src: Path, dest: Path, dry_run: bool, overwrite: bool) -> str:
    existed = dest.exists()
    if existed:
        if not overwrite:
            return "skipped (exists)"
        if not dry_run:
            shutil.rmtree(dest)
    if not dry_run:
        shutil.copytree(
            src,
            dest,
            symlinks=True,
            ignore=shutil.ignore_patterns(*IGNORE_PATTERNS),
        )
    return "overwritten" if existed else "copied"


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Copy Codex skills from ~/.codex/skills into a destination directory.",
    )
    parser.add_argument(
        "--source",
        default="~/.codex/skills",
        help="Source skills directory (default: ~/.codex/skills)",
    )
    parser.add_argument(
        "--dest",
        default=".",
        help="Destination directory (default: current working directory)",
    )
    parser.add_argument(
        "--include-system",
        action="store_true",
        help="Include the .system skills directory",
    )
    parser.add_argument(
        "--only",
        action="append",
        default=[],
        help="Comma-separated list of skill names to copy (repeatable)",
    )
    parser.add_argument(
        "--exclude",
        action="append",
        default=[],
        help="Comma-separated list of skill names to skip (repeatable)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be copied without making changes",
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Overwrite existing destination directories",
    )
    args = parser.parse_args()

    source = Path(os.path.expanduser(args.source)).resolve()
    dest = Path(os.path.expanduser(args.dest)).resolve()

    if not source.exists() or not source.is_dir():
        print(f"[ERROR] Source directory not found: {source}")
        return 1

    dest.mkdir(parents=True, exist_ok=True)

    only = set(_parse_list(args.only))
    exclude = set(_parse_list(args.exclude))

    candidates: List[Path] = []
    skipped_hidden: Set[str] = set()
    skipped_filtered: Set[str] = set()
    available_names: Set[str] = set()

    for child in source.iterdir():
        if not child.is_dir():
            continue
        name = child.name
        available_names.add(name)

        if name == ".system" and not args.include_system:
            skipped_hidden.add(name)
            continue
        if _is_hidden(name) and name != ".system" and not args.include_system:
            skipped_hidden.add(name)
            continue
        if only and name not in only:
            skipped_filtered.add(name)
            continue
        if exclude and name in exclude:
            skipped_filtered.add(name)
            continue

        candidates.append(child)

    missing_only = sorted(only - available_names) if only else []

    copied: List[str] = []
    skipped_exists: List[str] = []
    overwritten: List[str] = []

    for src in sorted(candidates, key=lambda p: p.name):
        dest_path = dest / src.name
        action = copy_skill_dir(src, dest_path, args.dry_run, args.overwrite)
        if action == "copied":
            copied.append(src.name)
        elif action == "overwritten":
            overwritten.append(src.name)
        else:
            skipped_exists.append(src.name)

    print(f"Source: {source}")
    print(f"Destination: {dest}")
    print(f"Dry run: {'yes' if args.dry_run else 'no'}")
    print(f"Include .system: {'yes' if args.include_system else 'no'}")
    if only:
        print(f"Only: {_format_list(only)}")
    if exclude:
        print(f"Exclude: {_format_list(exclude)}")
    print()

    if copied:
        print(f"Copied: {_format_list(copied)}")
    if overwritten:
        print(f"Overwritten: {_format_list(overwritten)}")
    if skipped_exists:
        print(f"Skipped (exists): {_format_list(skipped_exists)}")
    if skipped_hidden:
        print(f"Skipped (hidden/system): {_format_list(skipped_hidden)}")
    if skipped_filtered:
        print(f"Skipped (filtered): {_format_list(skipped_filtered)}")
    if missing_only:
        print(f"Not found in source: {_format_list(missing_only)}")
    if not any([copied, overwritten, skipped_exists]):
        print("No skills copied.")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
