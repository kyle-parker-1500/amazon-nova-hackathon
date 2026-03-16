#!/usr/bin/env python3
"""
Minecraft Java Edition Datapack Validator
Validates a datapack against the official specification from the Minecraft Wiki.

Usage:
    python validate.py <path_to_datapack>
    python validate.py <path_to_datapack> --verbose
    python validate.py <path_to_datapack> --strict
"""

import json
import os
import sys
import argparse
from pathlib import Path
from typing import Optional, Union

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

# Valid pack format values (major versions as integers)
# Format 88+ uses minor versions (88.0, 94.1) but the integer part is used here
VALID_PACK_FORMATS = {4, 5, 6, 7, 8, 9, 10, 12, 15, 18, 26, 41, 48, 57, 61, 71, 80, 81, 88, 94}

PACK_FORMAT_VERSIONS = {
    4:  "1.13 – 1.14.4",
    5:  "1.15 – 1.16.1",
    6:  "1.16.2 – 1.16.5",
    7:  "1.17 – 1.17.1",
    8:  "1.18 – 1.18.1",
    9:  "1.18.2",
    10: "1.19 – 1.19.3",
    12: "1.19.4",
    15: "1.20 – 1.20.1",
    18: "1.20.2",
    26: "1.20.3 – 1.20.4",
    41: "1.20.5 – 1.20.6",
    48: "1.21 – 1.21.1",
    57: "1.21.2 – 1.21.3",
    61: "1.21.4",
    71: "1.21.5",
    80: "1.21.6",
    81: "1.21.7 – 1.21.8",
    88: "1.21.9 – 1.21.10",
    94: "1.21.11",
}

# Legal characters per the wiki spec
LEGAL_NAMESPACE_CHARS = frozenset("0123456789abcdefghijklmnopqrstuvwxyz_-.")
LEGAL_PATH_CHARS      = frozenset("0123456789abcdefghijklmnopqrstuvwxyz_-./")

# Known content folder names and their allowed file extensions
CONTENT_FOLDERS: dict[str, list[str]] = {
    "advancement":          [".json"],
    "banner_pattern":       [".json"],
    "chat_type":            [".json"],
    "damage_type":          [".json"],
    "dimension":            [".json"],
    "dimension_type":       [".json"],
    "enchantment":          [".json"],
    "enchantment_provider": [".json"],
    "function":             [".mcfunction"],
    "instrument":           [".json"],
    "item_modifier":        [".json"],
    "jukebox_song":         [".json"],
    "loot_table":           [".json"],
    "painting_variant":     [".json"],
    "predicate":            [".json"],
    "recipe":               [".json"],
    "structure":            [".nbt"],
    "tag":                  [".json"],
    "trial_spawner":        [".json"],
    "worldgen":             [".json"],
}

# Deprecated folder names → replacement (renamed in pack format 48 / 1.21)
DEPRECATED_FOLDERS: dict[str, str] = {
    "advancements":  "advancement",
    "functions":     "function",
    "loot_tables":   "loot_table",
    "recipes":       "recipe",
    "tags":          "tag",        # top-level tags/ → tag/  (sub-structure also changed)
}

# Old tag sub-folders
DEPRECATED_TAG_SUBFOLDERS: dict[str, str] = {
    "items":  "item",
    "blocks": "block",
}

# Known recipe types
COOKING_TYPES = {"smelting", "blasting", "smoking", "campfire_cooking"}


# ---------------------------------------------------------------------------
# Result accumulator
# ---------------------------------------------------------------------------

class ValidationResult:
    def __init__(self) -> None:
        self.errors:   list[tuple[Optional[str], str]] = []
        self.warnings: list[tuple[Optional[str], str]] = []
        self.info:     list[tuple[Optional[str], str]] = []

    def error(self, msg: str, file: Optional[str] = None) -> None:
        self.errors.append((file, msg))

    def warn(self, msg: str, file: Optional[str] = None) -> None:
        self.warnings.append((file, msg))

    def note(self, msg: str, file: Optional[str] = None) -> None:
        self.info.append((file, msg))

    @property
    def valid(self) -> bool:
        return len(self.errors) == 0


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _illegal_chars(name: str, legal: frozenset) -> str:
    """Return a sorted string of characters in *name* that are not in *legal*."""
    bad = sorted({c for c in name if c not in legal})
    return "".join(bad)


def _rel(file: Optional[str], base: Path) -> str:
    """Return a display path relative to *base*, or the raw string on failure."""
    if not file:
        return ""
    try:
        return str(Path(file).relative_to(base))
    except ValueError:
        return file


def _load_json(file_path: Path, result: ValidationResult) -> Optional[Union[dict, list]]:
    """Parse *file_path* as JSON; record an error and return None on failure."""
    try:
        with open(file_path, "r", encoding="utf-8") as fh:
            return json.load(fh)
    except json.JSONDecodeError as exc:
        result.error(f"Invalid JSON: {exc}", str(file_path))
        return None
    except OSError as exc:
        result.error(f"Cannot read file: {exc}", str(file_path))
        return None


# ---------------------------------------------------------------------------
# pack.mcmeta
# ---------------------------------------------------------------------------

def _check_format_value(value: object, field: str, file_path: Path,
                         result: ValidationResult) -> Optional[int]:
    """
    Ensure *value* is a number and (loosely) a known pack format.
    Returns the integer major version or None on type error.
    """
    if not isinstance(value, (int, float)):
        result.error(
            f"'pack.{field}' must be a number, got {type(value).__name__}",
            str(file_path),
        )
        return None
    major = int(value)
    if major not in VALID_PACK_FORMATS:
        result.warn(
            f"'pack.{field}' value {value} is not a recognised pack format",
            str(file_path),
        )
    return major


def validate_pack_mcmeta(pack_path: Path, result: ValidationResult) -> None:
    mcmeta = pack_path / "pack.mcmeta"

    if not mcmeta.exists():
        result.error("Missing required file: pack.mcmeta")
        return

    data = _load_json(mcmeta, result)
    if data is None:
        return

    if not isinstance(data, dict) or "pack" not in data:
        result.error("pack.mcmeta must contain a top-level 'pack' object", str(mcmeta))
        return

    pack = data["pack"]
    if not isinstance(pack, dict):
        result.error("pack.mcmeta 'pack' must be a JSON object", str(mcmeta))
        return

    # --- description (required) ---
    if "description" not in pack:
        result.error("pack.mcmeta 'pack' missing required 'description' field", str(mcmeta))

    # --- min_format / max_format (mandatory per wiki) ---
    has_min = "min_format" in pack
    has_max = "max_format" in pack

    if not has_min:
        result.error("pack.mcmeta 'pack' missing required 'min_format' field", str(mcmeta))
    if not has_max:
        result.error("pack.mcmeta 'pack' missing required 'max_format' field", str(mcmeta))

    min_major = _check_format_value(pack.get("min_format"), "min_format", mcmeta, result) if has_min else None
    max_major = _check_format_value(pack.get("max_format"), "max_format", mcmeta, result) if has_max else None

    if min_major is not None and max_major is not None:
        if min_major > max_major:
            result.error(
                f"pack.mcmeta 'min_format' ({pack['min_format']}) must be <= "
                f"'max_format' ({pack['max_format']})",
                str(mcmeta),
            )
        else:
            lo = PACK_FORMAT_VERSIONS.get(min_major, str(min_major))
            hi = PACK_FORMAT_VERSIONS.get(max_major, str(max_major))
            result.note(
                f"Compatible with pack formats {pack['min_format']}–{pack['max_format']} "
                f"({lo} → {hi})",
                str(mcmeta),
            )

    # --- pack_format (still required by Minecraft alongside min/max) ---
    if "pack_format" not in pack:
        result.warn(
            "pack.mcmeta 'pack' missing 'pack_format' field "
            "(still required by Minecraft even when min/max_format are present)",
            str(mcmeta),
        )
    else:
        pf_major = _check_format_value(pack["pack_format"], "pack_format", mcmeta, result)
        if pf_major is not None:
            ver = PACK_FORMAT_VERSIONS.get(pf_major)
            if ver:
                result.note(
                    f"pack_format {pack['pack_format']} targets Java Edition {ver}",
                    str(mcmeta),
                )
            # pack_format must fall inside min_format..max_format
            if min_major is not None and max_major is not None:
                if not (min_major <= pf_major <= max_major):
                    result.error(
                        f"pack_format ({pack['pack_format']}) must be within "
                        f"[{pack['min_format']}, {pack['max_format']}]",
                        str(mcmeta),
                    )

    # --- warn about unknown keys ---
    known = {"description", "pack_format", "min_format", "max_format",
             "filter", "supported_formats"}
    unknown = set(pack.keys()) - known
    if unknown:
        result.warn(
            f"pack.mcmeta 'pack' contains unrecognised fields: "
            f"{', '.join(sorted(unknown))}",
            str(mcmeta),
        )


# ---------------------------------------------------------------------------
# pack.png
# ---------------------------------------------------------------------------

PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"


def validate_pack_icon(pack_path: Path, result: ValidationResult) -> None:
    icon = pack_path / "pack.png"
    if not icon.exists():
        result.note("No pack.png found (optional, but recommended)", str(icon))
        return
    try:
        with open(icon, "rb") as fh:
            header = fh.read(8)
        if header != PNG_SIGNATURE:
            result.error("pack.png does not appear to be a valid PNG file", str(icon))
        else:
            result.note("pack.png present", str(icon))
    except OSError as exc:
        result.warn(f"Cannot verify pack.png: {exc}", str(icon))


# ---------------------------------------------------------------------------
# Namespace / path name validation
# ---------------------------------------------------------------------------

def validate_namespace(name: str, path: Path, result: ValidationResult) -> None:
    if not name:
        result.error("Namespace name is empty", str(path))
        return
    bad = _illegal_chars(name, LEGAL_NAMESPACE_CHARS)
    if bad:
        result.error(
            f"Namespace '{name}' contains illegal characters: {bad!r} "
            f"(allowed: 0-9, a-z, _ - .)",
            str(path),
        )
    if "/" in name:
        result.error(f"Namespace '{name}' must not contain '/'", str(path))
    if name == "minecraft":
        result.note(
            "Using the 'minecraft' namespace — only appropriate for overriding "
            "vanilla content or appending to vanilla tags",
            str(path),
        )


def validate_resource_path(rel: str, file_path: Path, result: ValidationResult) -> None:
    """Validate the path portion of a resource location (no extension)."""
    bad = _illegal_chars(rel, LEGAL_PATH_CHARS)
    if bad:
        result.warn(
            f"Resource path '{rel}' contains illegal characters: {bad!r} "
            f"(allowed: 0-9, a-z, _ - . /)",
            str(file_path),
        )
    if any(c.isupper() for c in rel):
        result.warn(
            f"Resource path '{rel}' contains uppercase letters "
            "(convention is lower_snake_case)",
            str(file_path),
        )


# ---------------------------------------------------------------------------
# Per-type JSON validators
# ---------------------------------------------------------------------------

def validate_advancement(data: dict, fp: Path, result: ValidationResult) -> None:
    if not isinstance(data, dict):
        result.error("Advancement must be a JSON object", str(fp))
        return
    if "criteria" not in data:
        result.error("Advancement missing required 'criteria' field", str(fp))
    elif not isinstance(data["criteria"], dict):
        result.error("Advancement 'criteria' must be a JSON object", str(fp))


def validate_loot_table(data: dict, fp: Path, result: ValidationResult) -> None:
    if not isinstance(data, dict):
        result.error("Loot table must be a JSON object", str(fp))
        return
    if "type" not in data:
        result.warn("Loot table missing 'type' field", str(fp))
    pools = data.get("pools")
    if pools is not None:
        if not isinstance(pools, list):
            result.error("Loot table 'pools' must be an array", str(fp))
        else:
            for i, pool in enumerate(pools):
                if not isinstance(pool, dict):
                    result.error(f"Loot table pool[{i}] must be a JSON object", str(fp))
                    continue
                if "rolls" not in pool:
                    result.warn(f"Loot table pool[{i}] missing 'rolls' field", str(fp))
                if "entries" not in pool:
                    result.warn(f"Loot table pool[{i}] missing 'entries' field", str(fp))


def validate_recipe(data: dict, fp: Path, result: ValidationResult) -> None:
    if not isinstance(data, dict):
        result.error("Recipe must be a JSON object", str(fp))
        return

    if "type" not in data:
        result.error("Recipe missing required 'type' field", str(fp))
        return

    raw_type: str = data["type"]
    # Strip namespace prefix for matching
    local_type = raw_type.split(":")[-1] if ":" in raw_type else raw_type

    def need(field: str) -> None:
        if field not in data:
            result.error(
                f"{raw_type} recipe missing required '{field}' field", str(fp)
            )

    def suggest(field: str) -> None:
        if field not in data:
            result.warn(f"{raw_type} recipe missing '{field}' field", str(fp))

    if local_type == "crafting_shaped":
        need("key")
        need("result")
        if "pattern" not in data:
            need("pattern")
        else:
            pattern = data["pattern"]
            if not isinstance(pattern, list):
                result.error("Shaped recipe 'pattern' must be an array", str(fp))
            else:
                if len(pattern) > 3:
                    result.error(
                        "Shaped recipe 'pattern' may have at most 3 rows", str(fp)
                    )
                row_lens = [len(r) for r in pattern if isinstance(r, str)]
                if row_lens and len(set(row_lens)) > 1:
                    result.warn(
                        "Shaped recipe 'pattern' rows have inconsistent lengths",
                        str(fp),
                    )
                for row in pattern:
                    if isinstance(row, str) and len(row) > 3:
                        result.error(
                            "Shaped recipe 'pattern' row exceeds 3 characters", str(fp)
                        )
        # result.id vs result.item (1.20.5+ uses 'id')
        res = data.get("result")
        if isinstance(res, dict) and "id" not in res and "item" not in res:
            result.warn(
                "Shaped recipe 'result' should have an 'id' field "
                "(use 'id' for 1.20.5+, 'item' for older packs)",
                str(fp),
            )

    elif local_type == "crafting_shapeless":
        need("result")
        if "ingredients" not in data:
            need("ingredients")
        elif not isinstance(data["ingredients"], list):
            result.error("Shapeless recipe 'ingredients' must be an array", str(fp))
        res = data.get("result")
        if isinstance(res, dict) and "id" not in res and "item" not in res:
            result.warn(
                "Shapeless recipe 'result' should have an 'id' field "
                "(use 'id' for 1.20.5+, 'item' for older packs)",
                str(fp),
            )

    elif local_type in COOKING_TYPES:
        need("ingredient")
        need("result")
        suggest("experience")
        suggest("cookingtime")

    elif local_type == "stonecutting":
        need("ingredient")
        need("result")

    elif local_type == "smithing_transform":
        for f in ("base", "addition", "template", "result"):
            suggest(f)

    elif local_type == "smithing_trim":
        for f in ("base", "addition", "template"):
            suggest(f)

    elif local_type == "crafting_transmute":
        for f in ("input", "material", "result"):
            suggest(f)

    elif local_type == "crafting_special_armordye":
        pass  # no extra fields required

    else:
        result.note(f"Unknown recipe type '{raw_type}' — skipping structural checks", str(fp))


def validate_tag(data: dict, fp: Path, result: ValidationResult) -> None:
    if not isinstance(data, dict):
        result.error("Tag must be a JSON object", str(fp))
        return
    if "values" not in data:
        result.note("Tag has no 'values' field (empty tag)", str(fp))
    elif not isinstance(data["values"], list):
        result.error("Tag 'values' must be an array", str(fp))
    replace = data.get("replace")
    if replace is not None and not isinstance(replace, bool):
        result.error("Tag 'replace' must be a boolean", str(fp))


def validate_predicate(data: Union[dict, list], fp: Path,
                        result: ValidationResult) -> None:
    if isinstance(data, list):
        for i, item in enumerate(data):
            if isinstance(item, dict) and "condition" not in item:
                result.warn(f"Predicate[{i}] missing 'condition' field", str(fp))
    elif isinstance(data, dict):
        if "condition" not in data:
            result.warn("Predicate missing 'condition' field", str(fp))
    else:
        result.error("Predicate must be a JSON object or array", str(fp))


def validate_dimension(data: dict, fp: Path, result: ValidationResult) -> None:
    if not isinstance(data, dict):
        result.error("Dimension must be a JSON object", str(fp))
        return
    if "type" not in data:
        result.error("Dimension missing required 'type' field", str(fp))
    if "generator" not in data:
        result.error("Dimension missing required 'generator' field", str(fp))
    else:
        gen = data["generator"]
        if isinstance(gen, dict) and "type" not in gen:
            result.error(
                "Dimension 'generator' missing required 'type' field", str(fp)
            )


def validate_enchantment(data: dict, fp: Path, result: ValidationResult) -> None:
    if not isinstance(data, dict):
        result.error("Enchantment must be a JSON object", str(fp))
        return
    for field in ("description", "supported_items", "max_level"):
        if field not in data:
            result.warn(f"Enchantment missing '{field}' field", str(fp))


def validate_damage_type(data: dict, fp: Path, result: ValidationResult) -> None:
    if not isinstance(data, dict):
        result.error("Damage type must be a JSON object", str(fp))
        return
    if "message_id" not in data:
        result.warn("Damage type missing 'message_id' field", str(fp))
    if "scaling" not in data:
        result.warn("Damage type missing 'scaling' field", str(fp))


def validate_mcfunction(fp: Path, result: ValidationResult) -> None:
    """Basic sanity checks on an .mcfunction file."""
    try:
        with open(fp, "r", encoding="utf-8") as fh:
            lines = fh.readlines()
    except OSError as exc:
        result.error(f"Cannot read function file: {exc}", str(fp))
        return

    if not lines or all(ln.strip() == "" for ln in lines):
        result.note("Function file is empty", str(fp))
        return

    for i, raw_line in enumerate(lines, start=1):
        line = raw_line.rstrip("\n\r")
        stripped = line.strip()

        # Skip blank lines and comments
        if not stripped or stripped.startswith("#"):
            continue

        # A leading slash is a common mistake (functions don't use /)
        if stripped.startswith("/"):
            result.warn(
                f"Line {i}: command starts with '/' — "
                "function commands should not use a leading slash",
                str(fp),
            )

        # Detect obvious macro syntax errors ($ must be start of line for macros)
        if "$" in stripped and not stripped.startswith("$"):
            result.note(
                f"Line {i}: '$' inside a command — "
                "this may be a macro substitution (valid in format 18+)",
                str(fp),
            )


# ---------------------------------------------------------------------------
# Data folder walker
# ---------------------------------------------------------------------------

def validate_data_folder(pack_path: Path, result: ValidationResult) -> None:
    data_path = pack_path / "data"

    if not data_path.exists():
        result.error("Missing required 'data/' folder")
        return
    if not data_path.is_dir():
        result.error("'data' is not a directory")
        return

    namespace_dirs = [p for p in data_path.iterdir() if p.is_dir()]
    if not namespace_dirs:
        result.warn("'data/' folder contains no namespace sub-folders", str(data_path))
        return

    for ns_dir in sorted(namespace_dirs):
        namespace = ns_dir.name
        validate_namespace(namespace, ns_dir, result)
        _validate_namespace_contents(ns_dir, namespace, result)


def _validate_namespace_contents(
    ns_dir: Path, namespace: str, result: ValidationResult
) -> None:
    """Walk the contents of a single namespace folder."""
    for entry in sorted(ns_dir.iterdir()):
        if not entry.is_dir():
            # Files directly inside the namespace folder are unexpected
            result.warn(
                f"Unexpected file directly inside namespace folder (expected sub-folders): "
                f"{entry.name}",
                str(entry),
            )
            continue

        folder_name = entry.name

        # Check for deprecated top-level folder names
        if folder_name in DEPRECATED_FOLDERS:
            replacement = DEPRECATED_FOLDERS[folder_name]
            result.warn(
                f"Folder '{folder_name}/' is deprecated since pack format 48 (1.21+) — "
                f"rename to '{replacement}/'",
                str(entry),
            )

        # Check for deprecated tag sub-folder names inside old 'tags/' directory
        if folder_name in ("tags", "tag"):
            _check_tag_subfolders(entry, result)

        # Walk all files under this content folder
        effective = DEPRECATED_FOLDERS.get(folder_name, folder_name)
        for file_path in sorted(entry.rglob("*")):
            if not file_path.is_file():
                continue
            _validate_content_file(file_path, ns_dir, namespace, effective, result)


def _check_tag_subfolders(tag_dir: Path, result: ValidationResult) -> None:
    """Warn about deprecated tag sub-folder names (items → item, blocks → block)."""
    for sub in tag_dir.iterdir():
        if sub.is_dir() and sub.name in DEPRECATED_TAG_SUBFOLDERS:
            result.warn(
                f"Tag sub-folder '{sub.name}/' is deprecated since pack format 48 — "
                f"rename to '{DEPRECATED_TAG_SUBFOLDERS[sub.name]}/'",
                str(sub),
            )


def _validate_content_file(
    file_path: Path,
    ns_dir: Path,
    namespace: str,
    content_type: str,
    result: ValidationResult,
) -> None:
    """Validate a single content file inside a namespace."""
    rel_to_ns = file_path.relative_to(ns_dir)

    # Build the resource path portion (strip content-type folder prefix and extension)
    # e.g.  function/subfolder/foo.mcfunction  →  subfolder/foo
    rel_parts = list(rel_to_ns.parts)
    if len(rel_parts) >= 2:
        path_within_type = "/".join(rel_parts[1:])  # strip top-level content folder
        path_no_ext = path_within_type.rsplit(".", 1)[0] if "." in path_within_type else path_within_type
        validate_resource_path(path_no_ext, file_path, result)
    else:
        # File is directly inside the content-type folder (fine — just check name)
        name_no_ext = file_path.stem
        validate_resource_path(name_no_ext, file_path, result)

    # Check file extension against expected for this content type
    if content_type in CONTENT_FOLDERS:
        expected_exts = CONTENT_FOLDERS[content_type]
        if file_path.suffix not in expected_exts:
            result.warn(
                f"Unexpected extension '{file_path.suffix}' in '{content_type}/' "
                f"(expected: {', '.join(expected_exts)})",
                str(file_path),
            )

    # Dispatch to per-type validators
    ext = file_path.suffix

    if content_type == "function" and ext == ".mcfunction":
        validate_mcfunction(file_path, result)

    elif ext == ".json":
        data = _load_json(file_path, result)
        if data is None:
            return  # error already recorded

        dispatch: dict = {
            "advancement":   validate_advancement,
            "loot_table":    validate_loot_table,
            "recipe":        validate_recipe,
            "tag":           validate_tag,
            "predicate":     validate_predicate,
            "dimension":     validate_dimension,
            "enchantment":   validate_enchantment,
            "damage_type":   validate_damage_type,
        }
        validator = dispatch.get(content_type)
        if validator:
            validator(data, file_path, result)
        # For other .json types (worldgen, painting_variant, etc.) we at least
        # confirmed valid JSON above; no further structural checks here.


# ---------------------------------------------------------------------------
# Top-level entry point
# ---------------------------------------------------------------------------

def validate_datapack(pack_path: Path, result: ValidationResult) -> None:
    if not pack_path.exists():
        result.error(f"Path does not exist: {pack_path}")
        return
    if not pack_path.is_dir():
        result.error(f"Path is not a directory: {pack_path}")
        return

    validate_pack_mcmeta(pack_path, result)
    validate_pack_icon(pack_path, result)
    validate_data_folder(pack_path, result)


# ---------------------------------------------------------------------------
# Output
# ---------------------------------------------------------------------------

def _supports_color() -> bool:
    if os.environ.get("NO_COLOR"):
        return False
    if os.environ.get("FORCE_COLOR"):
        return True
    return hasattr(sys.stdout, "isatty") and sys.stdout.isatty()


def _c(text: str, *codes: str) -> str:
    """Apply ANSI color/style codes if supported."""
    if not _supports_color():
        return text
    return f"\033[{';'.join(codes)}m{text}\033[0m"


def print_results(result: ValidationResult, pack_path: Path, verbose: bool) -> None:
    print()
    print(_c("Minecraft Datapack Validator", "1"))
    print(_c(f"Pack: {pack_path.resolve()}", "36"))
    print()

    def show_group(
        items: list[tuple[Optional[str], str]],
        label: str,
        color: str,
        prefix: str,
    ) -> None:
        if not items:
            return
        print(_c(f"{label} ({len(items)}):", "1", color))
        for file, msg in items:
            loc = _rel(file, pack_path)
            if loc:
                print(f"  {_c(prefix, color)} {_c(loc + ':', '1')} {msg}")
            else:
                print(f"  {_c(prefix, color)} {msg}")
        print()

    show_group(result.errors,   "ERRORS",   "31", "[ERROR]")
    show_group(result.warnings, "WARNINGS", "33", "[WARN] ")
    if verbose:
        show_group(result.info, "INFO",     "34", "[INFO] ")

    # Summary line
    if result.valid:
        status = _c("VALID", "1", "32")
        sym    = _c("✓", "32")
    else:
        status = _c("INVALID", "1", "31")
        sym    = _c("✗", "31")

    parts = []
    if result.errors:
        parts.append(_c(f"{len(result.errors)} error(s)", "31"))
    if result.warnings:
        parts.append(_c(f"{len(result.warnings)} warning(s)", "33"))
    if result.info and verbose:
        parts.append(_c(f"{len(result.info)} note(s)", "34"))

    tail = " — " + ", ".join(parts) if parts else ""
    print(f"{sym} {status}{tail}")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main() -> int:
    parser = argparse.ArgumentParser(
        prog="validate.py",
        description="Validate a Minecraft Java Edition data pack.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
examples:
  python validate.py ./my_datapack
  python validate.py ./my_datapack --verbose
  python validate.py ./my_datapack --strict
  python validate.py .             # treat current directory as the datapack
        """,
    )
    parser.add_argument(
        "path",
        nargs="?",
        default=".",
        help="Path to the data pack folder (default: current directory)",
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Also print informational notes",
    )
    parser.add_argument(
        "--strict", "-s",
        action="store_true",
        help="Treat warnings as errors (non-zero exit if any warnings)",
    )
    args = parser.parse_args()

    pack_path = Path(args.path).resolve()
    result = ValidationResult()
    validate_datapack(pack_path, result)

    if args.strict:
        result.errors.extend(result.warnings)
        result.warnings.clear()

    print_results(result, pack_path, verbose=args.verbose)
    return 0 if result.valid else 1


if __name__ == "__main__":
    sys.exit(main())
