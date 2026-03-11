#!/usr/bin/env python3
"""Check WCAG contrast ratios for two hex colors."""

from __future__ import annotations

import argparse
import json
import re
import sys


HEX_PATTERN = re.compile(r"^#?(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$")
THRESHOLDS = {
    "normal": 4.5,
    "large": 3.0,
    "ui": 3.0,
}


def parse_hex(value: str) -> tuple[float, float, float]:
    if not HEX_PATTERN.match(value):
        raise ValueError(f"Invalid hex color: {value}")

    raw = value.lstrip("#")
    if len(raw) == 3:
        raw = "".join(channel * 2 for channel in raw)

    channels = tuple(int(raw[index:index + 2], 16) / 255 for index in (0, 2, 4))
    return channels


def linearize(channel: float) -> float:
    if channel <= 0.04045:
        return channel / 12.92
    return ((channel + 0.055) / 1.055) ** 2.4


def luminance(rgb: tuple[float, float, float]) -> float:
    red, green, blue = (linearize(channel) for channel in rgb)
    return 0.2126 * red + 0.7152 * green + 0.0722 * blue


def contrast_ratio(foreground: str, background: str) -> float:
    lum_one = luminance(parse_hex(foreground))
    lum_two = luminance(parse_hex(background))
    lighter = max(lum_one, lum_two)
    darker = min(lum_one, lum_two)
    return (lighter + 0.05) / (darker + 0.05)


def build_report(ratio: float) -> dict[str, object]:
    return {
        "ratio": round(ratio, 2),
        "passes": {
            "normal_aa": ratio >= 4.5,
            "normal_aaa": ratio >= 7.0,
            "large_aa": ratio >= 3.0,
            "large_aaa": ratio >= 4.5,
            "ui": ratio >= 3.0,
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Check WCAG contrast ratio for a foreground/background pair."
    )
    parser.add_argument("foreground", help="Foreground color in #RGB or #RRGGBB format")
    parser.add_argument("background", help="Background color in #RGB or #RRGGBB format")
    parser.add_argument(
        "--mode",
        choices=sorted(THRESHOLDS),
        default="normal",
        help="AA threshold used for the command exit code",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Print JSON output instead of human-readable text",
    )
    args = parser.parse_args()

    try:
        ratio = contrast_ratio(args.foreground, args.background)
    except ValueError as error:
        print(str(error), file=sys.stderr)
        return 2

    report = build_report(ratio)
    passes_mode = ratio >= THRESHOLDS[args.mode]

    if args.json:
        print(json.dumps(report))
    else:
        print(f"Contrast ratio: {report['ratio']}:1")
        print(f"Mode check ({args.mode} AA): {'pass' if passes_mode else 'fail'}")
        print(f"Normal text AA (4.5): {'pass' if report['passes']['normal_aa'] else 'fail'}")
        print(f"Normal text AAA (7.0): {'pass' if report['passes']['normal_aaa'] else 'fail'}")
        print(f"Large text AA (3.0): {'pass' if report['passes']['large_aa'] else 'fail'}")
        print(f"Large text AAA (4.5): {'pass' if report['passes']['large_aaa'] else 'fail'}")
        print(f"UI components (3.0): {'pass' if report['passes']['ui'] else 'fail'}")

    return 0 if passes_mode else 1


if __name__ == "__main__":
    raise SystemExit(main())
