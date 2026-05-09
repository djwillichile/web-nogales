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
