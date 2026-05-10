"""Descarga GeoJSON oficial de regiones y comunas de Chile, recorta a centro-sur y simplifica.

Uso:
    pip install -r scripts/requirements.txt
    python scripts/build_admin_boundaries.py

Salida:
    assets/data/regiones.geojson
    assets/data/comunas.geojson

Fuente: https://github.com/caracena/chile-geojson (basado en datos del INE).
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import requests
from shapely.geometry import box, mapping, shape

# Bbox Chile continental centro-sur (xmin, ymin, xmax, ymax) en EPSG:4326.
BBOX = (-76.0, -44.5, -68.0, -29.0)

# Repo root = parent del directorio scripts/.
REPO_ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = REPO_ROOT / "assets" / "data"

SOURCES = {
    "regiones.geojson": (
        "https://raw.githubusercontent.com/caracena/chile-geojson/master/regiones.geojson",
        0.01,  # tolerancia simplify (grados ~ 1 km)
    ),
    "comunas.geojson": (
        "https://raw.githubusercontent.com/caracena/chile-geojson/master/comunas.geojson",
        0.005,  # tolerancia simplify (grados ~ 500 m)
    ),
}


def log(msg: str) -> None:
    print(msg, flush=True)


def download_geojson(url: str) -> dict:
    log(f"  ↓ {url}")
    r = requests.get(url, timeout=180)
    r.raise_for_status()
    return r.json()


def filter_and_simplify(geojson: dict, tolerance: float) -> dict:
    """Conserva solo features que intersectan el BBOX y simplifica geometrías."""
    bbox_geom = box(*BBOX)
    out_features: list[dict] = []
    skipped = 0

    for feat in geojson.get("features", []):
        geom = shape(feat["geometry"])
        if not geom.intersects(bbox_geom):
            skipped += 1
            continue
        simplified = geom.simplify(tolerance, preserve_topology=True)
        if simplified.is_empty:
            skipped += 1
            continue
        new_feat = {
            "type": "Feature",
            "properties": feat.get("properties", {}),
            "geometry": mapping(simplified),
        }
        out_features.append(new_feat)

    log(f"    {len(out_features)} features conservadas, {skipped} fuera del bbox")
    return {"type": "FeatureCollection", "features": out_features}


def main() -> int:
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    for filename, (url, tolerance) in SOURCES.items():
        log(f"[{filename}]")
        raw = download_geojson(url)
        result = filter_and_simplify(raw, tolerance)
        out_path = DATA_DIR / filename
        with out_path.open("w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, separators=(",", ":"))
        size_kb = out_path.stat().st_size / 1024
        log(f"  ✓ {out_path.relative_to(REPO_ROOT)}  ({size_kb:.1f} KB)")

    log("✓ Límites administrativos generados.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
