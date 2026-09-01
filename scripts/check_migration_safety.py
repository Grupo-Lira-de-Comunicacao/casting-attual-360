#!/usr/bin/env python3
from __future__ import annotations

import argparse
import re
import subprocess
import sys
from pathlib import Path

MIGRATIONS = Path("supabase/migrations")
DESTRUCTIVE_PATTERNS = {
    "drop_table": re.compile(r"\bdrop\s+table\b", re.I),
    "drop_column": re.compile(r"\balter\s+table\b[\s\S]*?\bdrop\s+column\b", re.I),
    "truncate": re.compile(r"\btruncate\b", re.I),
    "delete_without_where": re.compile(r"\bdelete\s+from\s+[\w.]+\s*;", re.I),
}
REVIEW_MARKER = "ATLAS-MIGRATION: destructive-reviewed"
BACKUP_MARKER = "ATLAS-MIGRATION: backup-verified"


def git(*args: str) -> str:
    return subprocess.check_output(["git", *args], text=True).strip()


def changed_migrations(base_ref: str) -> list[Path]:
    try:
        names = git("diff", "--name-only", f"{base_ref}...HEAD").splitlines()
    except subprocess.CalledProcessError:
        names = git("diff", "--name-only", "HEAD~1", "HEAD").splitlines()
    return [Path(name) for name in names if name.startswith("supabase/migrations/") and name.endswith(".sql")]


def prefix(path: Path) -> str | None:
    match = re.match(r"^(\d+)[_-]", path.name)
    return match.group(1) if match else None


def duplicate_prefixes() -> dict[str, list[str]]:
    grouped: dict[str, list[str]] = {}
    if not MIGRATIONS.exists():
        return grouped
    for path in sorted(MIGRATIONS.glob("*.sql")):
        value = prefix(path)
        if value:
            grouped.setdefault(value, []).append(path.name)
    return {key: values for key, values in grouped.items() if len(values) > 1}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-ref", default="origin/main")
    args = parser.parse_args()

    changed = changed_migrations(args.base_ref)
    duplicates = duplicate_prefixes()
    failures: list[str] = []
    warnings: list[str] = []

    for key, names in sorted(duplicates.items()):
        warnings.append(f"baseline duplicate migration prefix {key}: {', '.join(names)}")

    for path in changed:
        if not path.exists():
            failures.append(f"migration deletion is not promotion-safe: {path}")
            continue
        text = path.read_text(encoding="utf-8")
        path_prefix = prefix(path)
        if path_prefix and path_prefix in duplicates:
            failures.append(
                f"changed migration uses duplicate prefix {path_prefix}: {path.name}. "
                "Use a new unique migration identifier."
            )
        destructive = [name for name, pattern in DESTRUCTIVE_PATTERNS.items() if pattern.search(text)]
        if destructive:
            if REVIEW_MARKER not in text:
                failures.append(
                    f"{path}: destructive operations {destructive} require marker '{REVIEW_MARKER}'"
                )
            if BACKUP_MARKER not in text:
                failures.append(
                    f"{path}: destructive operations require marker '{BACKUP_MARKER}'"
                )

    print("ATLAS migration safety report")
    print(f"changed_migrations={len(changed)}")
    for item in warnings:
        print(f"WARNING: {item}")
    for item in failures:
        print(f"BLOCK: {item}")

    if failures:
        return 2
    print("RESULT: promotion-eligible")
    return 0


if __name__ == "__main__":
    sys.exit(main())
