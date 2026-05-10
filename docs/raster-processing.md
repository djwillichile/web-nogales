# Procesamiento recomendado de rasters agroclimáticos

Este documento resume cómo preparar GeoTIFF pesados para una aplicación web Leaflet sin perder el respaldo científico de los datos originales.

## Principios

- Mantener siempre los GeoTIFF originales intactos.
- No subir rasters pesados a GitHub.
- Crear versiones optimizadas para visualización web.
- Documentar unidad, resolución, nodata, rango de valores, variable, escenario y mes.
- Separar visualización de análisis: el suavizado visual no cambia la resolución real del dato.

## Formatos recomendados

| Uso | Formato recomendado |
| --- | --- |
| Visualización dinámica | COG + TiTiler/rio-tiler |
| Visualización estática muy rápida | Tiles XYZ/WMTS |
| Infraestructura GIS clásica | GeoServer WMS/WMTS |
| Vectores, metadatos y estadísticas | PostGIS |

## Conversión conceptual a COG

```bash
gdal_translate input.tif output_cog.tif \
  -of COG \
  -co COMPRESS=DEFLATE \
  -co PREDICTOR=2 \
  -co BLOCKSIZE=512
```

Crear overviews para navegación eficiente:

```bash
gdaladdo -r average output_cog.tif 2 4 8 16 32
```

## Política de resampling

| Variable | Tipo | Resampling para visualización | Overviews |
| --- | --- | --- | --- |
| Precipitación mensual | Continua | bilinear o cubic | average |
| Temperatura mínima media | Continua | bilinear o cubic | average |
| Temperatura media | Continua | bilinear o cubic | average |
| Temperatura máxima media | Continua | bilinear o cubic | average |
| Variables bioclimáticas continuas | Continua | bilinear o cubic | average |
| Aptitud de nogal por clases | Categórica | nearest | mode/nearest |
| Límites administrativos | Vector | no aplica | no aplica |

## Nota sobre píxeles de 1 km

Si el dato original tiene resolución de 1 km, el visor puede ofrecer una capa suavizada para lectura visual, pero debe informar que la resolución efectiva sigue siendo de 1 km. Para capas categóricas, como aptitud por clase, no se debe usar bilinear ni cubic porque generaría clases intermedias falsas.

## Integración futura con el visor

El archivo `assets/js/app.js` contiene el objeto `LAYER_CATALOG`. Cada capa real debería registrarse con:

- identificador de variable;
- nombre visible;
- unidad;
- tipo de servicio (`xyz`, `wms`, `cog` o equivalente);
- URL;
- rango mínimo/máximo;
- paleta;
- escenario;
- mes;
- método de resampling recomendado.

## Pipeline WorldClim 2.1 + CMIP6 (implementado)

El script `scripts/build_worldclim_cogs.py` automatiza la generación de los COGs que consume el visor desde `assets/data/cogs/`.

### Qué genera

- **Variables:** precipitación (`prec`), temperatura mínima (`tmin`), temperatura media (`tavg`), temperatura máxima (`tmax`).
- **Escenarios:** baseline (1970–2000) + CMIP6 ACCESS-CM2 SSP245 para 2030 (2021–2040), 2050 (2041–2060) y 2070 (2061–2080).
- **Resolución:** 2.5 arc-min (~5 km), recortado al BBOX `(-76, -44.5, -68, -29)`.
- **Total:** 4 variables × 4 escenarios × 12 meses = **192 COGs**, ~10–40 MB en el repo.

Para CMIP6, `tavg` se deriva como `(tmin + tmax) / 2` banda a banda, dado que WorldClim no publica `tavg` futuro.

### Cómo correrlo

```bash
pip install -r scripts/requirements.txt
python scripts/build_worldclim_cogs.py            # todo
python scripts/build_worldclim_cogs.py --scenario baseline
python scripts/build_worldclim_cogs.py --variable prec --scenario 2050_ssp245
```

Los archivos generados se commitean al repo (`assets/data/cogs/{escenario}/{var}_{MM}.tif`) y el visor los carga vía `georaster-layer-for-leaflet`. Si un COG no existe, el visor cae al raster mock SVG.

### Convención de nombres

```
assets/data/cogs/baseline/prec_03.tif
assets/data/cogs/2050_ssp245/tmin_07.tif
```

### Migración a mayor resolución

Para subir a 30 arc-sec (~1 km), reemplazar `2.5m` por `30s` en las URLs del script y mover los COGs a un bucket externo (S3/R2/GCS con CORS). El JS solo necesita cambiar `COG_BASE` a la URL del bucket.
