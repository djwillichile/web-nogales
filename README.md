# Visor agroclimático para nogal

Aplicación web interactiva de cartografía agroclimática para explorar variables climáticas y de aptitud de nogal en Chile centro-sur. La primera versión funciona como prototipo técnico con capas simuladas, límites administrativos mock y una estructura preparada para reemplazar los datos por GeoJSON oficiales, GeoTIFF optimizados, COG, WMS, WMTS o tiles XYZ.

**Deploy público:** [https://djwillichile.github.io/web-nogales/](https://djwillichile.github.io/web-nogales/)

## Funcionalidades incluidas

- Mapa Leaflet a pantalla completa centrado en Chile centro-sur.
- Mapa base topográfico de Esri y alternativa OpenStreetMap.
- Panel flotante compacto inspirado en visores GIS profesionales.
- Selector de variable:
  - precipitación mensual;
  - temperatura mínima media;
  - temperatura media;
  - temperatura máxima media;
  - aptitud de nogal;
  - variables bioclimáticas.
- Selector temporal/escenario: línea base, 2030, 2050 y 2070.
- Selector mensual mediante radio buttons.
- Límites administrativos simulados de regiones y comunas.
- Raster climático mock semitransparente con gradiente norte-sur.
- Paleta de colores dinámica según la variable seleccionada.
- Leyenda compacta con unidad, rango y advertencia de resolución mock.
- Control de opacidad y opción de suavizado para variables continuas.
- Popups de consulta con coordenadas, variable, escenario, mes y valor simulado.
- Controles de home, refresh, ubicación, búsqueda preparada, consulta y marcador manual.
- Integración con Leaflet Draw para polígonos, rectángulos, marcadores, edición y eliminación.
- Diseño responsivo para desktop y mobile.

## Estructura

```text
web-nogales/
├── index.html
├── README.md
├── assets/
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   └── app.js
│   └── data/
│       ├── mock-regiones.geojson
│       └── mock-comunas.geojson
└── docs/
    └── raster-processing.md
```

## Ejecutar localmente

Por seguridad del navegador, los archivos GeoJSON se cargan con `fetch`, por lo que se recomienda ejecutar la app con un servidor estático y no directamente con `file://`.

```bash
python3 -m http.server 8000
```

Luego abrir:

```text
http://localhost:8000
```

## Publicar en GitHub Pages

El repositorio incluye el workflow `.github/workflows/deploy-pages.yml`, que despliega automáticamente el sitio estático en GitHub Pages cada vez que hay push o merge a `main`, `master` o `work`. También se puede disparar manualmente desde la pestaña **Actions** (`workflow_dispatch`).

Para activarlo en GitHub:

1. Subir los archivos a GitHub.
2. Entrar al repositorio en GitHub.
3. Ir a **Settings > Pages**.
4. En **Build and deployment**, seleccionar:
   - Source: **GitHub Actions**.
5. Guardar y esperar a que el workflow `Deploy static viewer to GitHub Pages` complete su ejecución en la pestaña **Actions**.

La plataforma queda publicada en:

[https://djwillichile.github.io/web-nogales/](https://djwillichile.github.io/web-nogales/)

## Datos mock y datos reales

Los archivos en `assets/data` son límites simplificados para prototipo visual. No son límites oficiales y no deben usarse para análisis, reportes ni decisiones técnicas.

La capa climática inicial es un SVG mock generado en el navegador. Sirve para validar la interfaz, las paletas, los controles y los popups antes de conectar capas reales.

## Recomendación para GeoTIFF pesados

No se recomienda subir GeoTIFF pesados al repositorio ni cargarlos completos en Leaflet. El flujo recomendado es:

1. Mantener GeoTIFF originales fuera del repositorio.
2. Convertirlos a Cloud Optimized GeoTIFF, tiles XYZ o publicarlos vía WMS/WMTS.
3. Consumirlos desde Leaflet como tiles.
4. Usar PostGIS para límites, metadatos, footprints, predios y resultados tabulares, no necesariamente para servir todos los raster.

## Próximos pasos

- Reemplazar límites mock por GeoJSON oficiales de regiones y comunas.
- Convertir GeoTIFF de precipitación, temperatura, bioclimáticas y aptitud a COG.
- Publicar rasters mediante TiTiler, GeoServer, WMS/WMTS o tiles XYZ.
- Completar el catálogo `LAYER_CATALOG` con URLs reales por variable, escenario y mes.
- Implementar consulta real por punto usando WMS GetFeatureInfo, API o lectura de COG en backend.
- Implementar estadísticas zonales por polígono dibujado o por comuna.
- Exportar dibujos y consultas a GeoJSON/PDF/CSV.
