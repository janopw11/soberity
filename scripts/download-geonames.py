#!/usr/bin/env python3
"""Download an operator snapshot from fixed GeoNames HTTPS sources; never a user-search dependency."""
import argparse
import datetime
import hashlib
import json
import os
from pathlib import Path
import urllib.request

FILES = ("countryInfo.txt", "allCountries.zip", "alternateNamesV2.zip", "admin1CodesASCII.txt", "admin2Codes.txt", "timeZones.txt")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("directory", type=Path)
    args = parser.parse_args()
    args.directory.mkdir(parents=True, exist_ok=True)
    manifest = {}
    for name in FILES:
        url = "https://download.geonames.org/export/dump/" + name
        part = args.directory / (name + ".part")
        digest = hashlib.sha256()
        try:
            with urllib.request.urlopen(url, timeout=120) as response, part.open("wb") as target:
                if not response.url.startswith("https://download.geonames.org/"):
                    raise ValueError("Unexpected download destination")
                for chunk in iter(lambda: response.read(1024 * 1024), b""):
                    digest.update(chunk)
                    target.write(chunk)
            os.replace(part, args.directory / name)
            manifest[name] = {"sourceUrl": url, "sha256": digest.hexdigest(), "downloadedAt": datetime.datetime.now(datetime.timezone.utc).isoformat()}
            print("Downloaded " + name)
        finally:
            part.unlink(missing_ok=True)
    pending = args.directory / "download-manifest.json.part"
    pending.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    os.replace(pending, args.directory / "download-manifest.json")
    (args.directory / "ATTRIBUTION.txt").write_text("Location data: GeoNames, https://www.geonames.org/, CC BY 4.0, https://creativecommons.org/licenses/by/4.0/. Soberity filters active settlements and normalizes search names.\n", encoding="utf-8")


if __name__ == "__main__":
    main()
