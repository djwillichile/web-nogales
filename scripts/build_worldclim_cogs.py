"""Pipeline para descargar WorldClim 2.1 y CMIP6, recortar a Chile centro-sur y exportar COGs.

Genera 4 variables (prec, tmin, tavg, tmax) x 4 escenarios (baseline + 2030/2050/2070 SSP245) x 12 meses = 192 COGs.

Uso:
    pip install -r scripts/requirements.txt
    python scripts/build_worldclim_cogs.py            # todo
    python scripts/build_worldclim_cogs.py --scenario baseline
    python scripts/build_worldclim_cogs.py --variable prec --scenario 2050_ssp245

Los COGs se escriben en assets/data/cogs/{scenario}/{var}_{MM}.tif.
"""

from __future__ import annotations

import argparse
import io
import sys
import zipfile
from pathlib import Path
from typing import Iterable

import numpy as np
import rasterio
import requests
from rasterio.windows import from_bounds

# Bbox Chile continental centro-sur (xmin, ymin, xmax, ymax) en EPSG:4326.
BBOX = (-76.0, -44.5, -68.0, -29.0)

# Repo root = parent del directorio scripts/.
REPO_ROOT = Path(__file__).resolve().parents[1]
COG_ROOT = REPO_ROOT / "assets" / "data" / "cogs"

GCM = "ACCESS-CM2"
SSP = "ssp245"

# WorldClim variable ids (sus archivos) -> nombre que usaremos en assets/data/cogs.
VARIABLES = {
    "prec": "prec",
    "tmin": "tmin",
    "tmax": "tmax",
    "tavg": "tavg",
    "bio": "bio",  # bioclimáticas anuales: 19 capas BIO1..BIO19
}

# Escenarios -> (kind, period_string).
# kind = "baseline"  -> WorldClim 2.1 base
# kind = "future"    -> CMIP6 (period 2021-2040, 2041-2060, 2061-2080)
SCENARIOS = {
    "baseline": ("baseline", None),
    "2030_ssp245": ("future", "2021-2040"),
    "2050_ssp245": ("future", "2041-2060"),
    "2070_ssp245": ("future", "2061-2080"),
}

BASELINE_ZIP_URL = "https://geodata.ucdavis.edu/climate/worldclim/2_1/base/wc2.1_2.5m_{var}.zip"
CMIP6_TIF_URL = (
    "https://geodata.ucdavis.edu/cmip6/2.5m/{gcm}/{ssp}/wc2.1_2.5m_{var}_{gcm}_{ssp}_{period}.tif"
)
# CMIP6 nombra el archivo bioclim como `bioc` (no `bio`).
CMIP6_BIO_VAR = "bioc"

COG_PROFILE = {
    "driver": "COG",
    "compress": "DEFLATE",
    "predictor": 3,  # PREDICTOR=3 ideal para float32
    "blocksize": 256,
    "overview_resampling": "average",
    "BIGTIFF": "IF_SAFER",
}


def log(msg: str) -> None:
    print(msg, flush=True)


def download(url: str) -> bytes:
    log(f"  ↓ {url}")
    r = requests.get(url, stream=True, timeout=600)
    r.raise_for_status()
    chunks: list[bytes] = []
    total = int(r.headers.get("content-length", 0))
    seen = 0
    for chunk in r.iter_content(chunk_size=1 << 20):  # 1 MiB
        if not chunk:
            continue
        chunks.append(chunk)
        seen += len(chunk)
        if total:
            pct = seen * 100 // total
            print(f"\r    {seen / 1e6:6.1f} / {total / 1e6:6.1f} MB ({pct:3d}%)", end="", flush=True)
    if total:
        print()
    return b"".join(chunks)


def extract_baseline_tifs(zip_bytes: bytes, var: str, expected_count: int = 12) -> dict[int, bytes]:
    """Devuelve {índice: bytes_tif} para los archivos dentro del zip de WorldClim baseline.

    Para variables mensuales (prec/tmin/tmax/tavg) son 12 (1..12).
    Para bioclim son 19 (1..19, sin padding en el nombre original).
    """
    out: dict[int, bytes] = {}
    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
        for name in zf.namelist():
            if not name.endswith(".tif"):
                continue
            stem = Path(name).stem
            try:
                idx = int(stem.split("_")[-1])
            except ValueError:
                continue
            if 1 <= idx <= expected_count:
                out[idx] = zf.read(name)
    if len(out) != expected_count:
        raise RuntimeError(f"Esperaba {expected_count} archivos para {var} baseline, obtuve {sorted(out)}")
    return out


def crop_to_cog(src_bytes: bytes, dst_path: Path, band: int = 1) -> None:
    """Lee el GeoTIFF en memoria, recorta al BBOX y escribe COG."""
    dst_path.parent.mkdir(parents=True, exist_ok=True)

    with rasterio.io.MemoryFile(src_bytes) as memfile:
        with memfile.open() as src:
            window = from_bounds(*BBOX, transform=src.transform).round_offsets().round_lengths()
            transform = src.window_transform(window)
            data = src.read(band, window=window, masked=True)

            # Convertimos a float32 para que predictor=3 aplique.
            data = data.astype(np.float32, copy=False)
            nodata = float(src.nodatavals[band - 1]) if src.nodatavals[band - 1] is not None else -3.4e38

            profile = {
                **COG_PROFILE,
                "dtype": "float32",
                "count": 1,
                "height": data.shape[0],
                "width": data.shape[1],
                "transform": transform,
                "crs": src.crs,
                "nodata": nodata,
            }

            with rasterio.open(dst_path, "w", **profile) as dst:
                if hasattr(data, "filled"):
                    dst.write(data.filled(nodata), 1)
                else:
                    dst.write(data, 1)


def build_baseline(variables: Iterable[str]) -> None:
    scenario_dir = COG_ROOT / "baseline"
    for var in variables:
        log(f"[baseline] {var}")
        url = BASELINE_ZIP_URL.format(var=var)
        zip_bytes = download(url)
        expected = 19 if var == "bio" else 12
        items = extract_baseline_tifs(zip_bytes, var, expected_count=expected)
        for idx, tif in items.items():
            dst = scenario_dir / f"{VARIABLES[var]}_{idx:02d}.tif"
            log(f"    ⤷ {dst.relative_to(REPO_ROOT)}")
            crop_to_cog(tif, dst)


def build_future_var(var: str, scenario_key: str, period: str) -> None:
    """Para CMIP6 cada archivo es un GeoTIFF multibanda con 12 meses como bandas."""
    url = CMIP6_TIF_URL.format(gcm=GCM, ssp=SSP, var=var, period=period)
    tif_bytes = download(url)
    scenario_dir = COG_ROOT / scenario_key
    for month in range(1, 13):
        dst = scenario_dir / f"{VARIABLES[var]}_{month:02d}.tif"
        log(f"    ⤷ {dst.relative_to(REPO_ROOT)}")
        crop_to_cog(tif_bytes, dst, band=month)


def build_future_bio(scenario_key: str, period: str) -> None:
    """Para CMIP6 bioclim, archivo es multibanda con 19 capas BIO1..BIO19."""
    url = CMIP6_TIF_URL.format(gcm=GCM, ssp=SSP, var=CMIP6_BIO_VAR, period=period)
    tif_bytes = download(url)
    scenario_dir = COG_ROOT / scenario_key
    for bio_idx in range(1, 20):
        dst = scenario_dir / f"bio_{bio_idx:02d}.tif"
        log(f"    ⤷ {dst.relative_to(REPO_ROOT)}")
        crop_to_cog(tif_bytes, dst, band=bio_idx)


def build_future_tavg(scenario_key: str, period: str) -> None:
    """CMIP6 no entrega tavg; lo derivamos como (tmin + tmax) / 2 banda a banda."""
    url_tmin = CMIP6_TIF_URL.format(gcm=GCM, ssp=SSP, var="tmin", period=period)
    url_tmax = CMIP6_TIF_URL.format(gcm=GCM, ssp=SSP, var="tmax", period=period)
    log("  ↓ tmin (para derivar tavg)")
    tmin_bytes = download(url_tmin)
    log("  ↓ tmax (para derivar tavg)")
    tmax_bytes = download(url_tmax)

    scenario_dir = COG_ROOT / scenario_key

    with rasterio.io.MemoryFile(tmin_bytes) as mf_min, rasterio.io.MemoryFile(tmax_bytes) as mf_max:
        with mf_min.open() as src_min, mf_max.open() as src_max:
            window = from_bounds(*BBOX, transform=src_min.transform).round_offsets().round_lengths()
            transform = src_min.window_transform(window)

            for month in range(1, 13):
                a = src_min.read(month, window=window, masked=True).astype(np.float32, copy=False)
                b = src_max.read(month, window=window, masked=True).astype(np.float32, copy=False)
                avg = (a + b) / 2.0
                nodata = -3.4e38

                profile = {
                    **COG_PROFILE,
                    "dtype": "float32",
                    "count": 1,
                    "height": avg.shape[0],
                    "width": avg.shape[1],
                    "transform": transform,
                    "crs": src_min.crs,
                    "nodata": nodata,
                }

                dst = scenario_dir / f"tavg_{month:02d}.tif"
                log(f"    ⤷ {dst.relative_to(REPO_ROOT)}  (derivado)")
                dst.parent.mkdir(parents=True, exist_ok=True)
                with rasterio.open(dst, "w", **profile) as dst_ds:
                    dst_ds.write(avg.filled(nodata) if hasattr(avg, "filled") else avg, 1)


def build_future(variables: Iterable[str], scenario_key: str, period: str) -> None:
    log(f"[{scenario_key}]")
    for var in variables:
        if var == "tavg":
            build_future_tavg(scenario_key, period)
        elif var == "bio":
            log("  bio (19 capas)")
            build_future_bio(scenario_key, period)
        else:
            log(f"  {var}")
            build_future_var(var, scenario_key, period)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--scenario",
        choices=list(SCENARIOS.keys()) + ["all"],
        default="all",
        help="Escenario a construir (default: all).",
    )
    ap.add_argument(
        "--variable",
        choices=list(VARIABLES.keys()) + ["all"],
        default="all",
        help="Variable a construir (default: all).",
    )
    args = ap.parse_args()

    scenarios = list(SCENARIOS.keys()) if args.scenario == "all" else [args.scenario]
    variables = list(VARIABLES.keys()) if args.variable == "all" else [args.variable]

    COG_ROOT.mkdir(parents=True, exist_ok=True)

    for sk in scenarios:
        kind, period = SCENARIOS[sk]
        if kind == "baseline":
            build_baseline(variables)
        else:
            build_future(variables, sk, period)

    log("✓ COGs generados en assets/data/cogs/")
    return 0


if __name__ == "__main__":
    sys.exit(main())
