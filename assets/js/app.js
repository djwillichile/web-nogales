/*
 * Visor agroclimático para nogal.
 * Los raster y límites incluidos son mocks de demostración: reemplazar por COG,
 * WMS, WMTS, XYZ tiles o GeoJSON/PostGIS oficiales cuando estén disponibles.
 */
const INITIAL_VIEW = {
  center: [-37.15, -72.45],
  zoom: 6,
  bounds: L.latLngBounds([-41.4, -74.6], [-33.9, -69.2]),
};

const MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

const COG_BASE = 'assets/data/cogs';

const SCENARIO_TO_FOLDER = {
  baseline: 'baseline',
  2030: '2030_ssp245',
  2050: '2050_ssp245',
  2070: '2070_ssp245',
};

const LAYER_CATALOG = {
  precipitacion: {
    label: 'Precipitación mensual',
    unit: 'mm',
    range: [0, 260],
    resampling: 'bilinear/average para visualización',
    palette: ['#9e0142', '#d53e4f', '#f46d43', '#fdae61', '#fee08b', '#abdda4', '#66c2a5', '#3288bd'],
    note: 'WorldClim 2.1 / CMIP6 (ACCESS-CM2 SSP245), recortado a Chile centro-sur.',
    type: 'cog',
    cogVar: 'prec',
  },
  temp_min: {
    label: 'Temperatura mínima media',
    unit: '°C',
    range: [-4, 16],
    resampling: 'bilinear/cubic para visualización',
    palette: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffbf', '#fdae61', '#f46d43', '#a50026'],
    note: 'WorldClim 2.1 / CMIP6 (ACCESS-CM2 SSP245), recortado a Chile centro-sur.',
    type: 'cog',
    cogVar: 'tmin',
  },
  temp_media: {
    label: 'Temperatura media',
    unit: '°C',
    range: [2, 24],
    resampling: 'bilinear/cubic para visualización',
    palette: ['#2c7bb6', '#00a6ca', '#00ccbc', '#90eb9d', '#ffff8c', '#f9d057', '#f29e2e', '#e76818', '#d7191c'],
    note: 'WorldClim 2.1 / CMIP6 (ACCESS-CM2 SSP245). Para CMIP6, derivada como (tmin+tmax)/2.',
    type: 'cog',
    cogVar: 'tavg',
  },
  temp_max: {
    label: 'Temperatura máxima media',
    unit: '°C',
    range: [8, 36],
    resampling: 'bilinear/cubic para visualización',
    palette: ['#4575b4', '#91bfdb', '#e0f3f8', '#ffffbf', '#fee090', '#fc8d59', '#d73027', '#7f0000'],
    note: 'WorldClim 2.1 / CMIP6 (ACCESS-CM2 SSP245), recortado a Chile centro-sur.',
    type: 'cog',
    cogVar: 'tmax',
  },
  aptitud_nogal: {
    label: 'Aptitud de nogal',
    unit: 'categoría',
    range: ['No apta', 'Baja', 'Media', 'Alta', 'Muy alta'],
    resampling: 'nearest/mode; no usar bilinear en categorías',
    palette: ['#b2182b', '#ef8a62', '#fddbc7', '#d9f0d3', '#1a9850'],
    note: 'Capa categórica mock. Pendiente derivar de aptitud climática real.',
    type: 'mock',
  },
};

const BIO_PALETTE_TEMP = ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffbf', '#fdae61', '#f46d43', '#a50026'];
const BIO_PALETTE_PREC = ['#9e0142', '#d53e4f', '#f46d43', '#fdae61', '#fee08b', '#abdda4', '#66c2a5', '#3288bd'];
const BIO_PALETTE_DIVERGING = ['#5e4fa2', '#3288bd', '#66c2a5', '#abdda4', '#e6f598', '#fee08b', '#fdae61', '#f46d43', '#9e0142'];

const BIOCLIM_META = {
  bio_01: { label: 'BIO1 — Temp media anual', unit: '°C', range: [-2, 22], palette: BIO_PALETTE_TEMP },
  bio_02: { label: 'BIO2 — Rango diurno medio', unit: '°C', range: [4, 18], palette: BIO_PALETTE_DIVERGING },
  bio_03: { label: 'BIO3 — Isotermalidad', unit: '%', range: [30, 70], palette: BIO_PALETTE_DIVERGING },
  bio_04: { label: 'BIO4 — Estacionalidad temp.', unit: '×100', range: [200, 900], palette: BIO_PALETTE_DIVERGING },
  bio_05: { label: 'BIO5 — Tmáx mes más cálido', unit: '°C', range: [10, 32], palette: BIO_PALETTE_TEMP },
  bio_06: { label: 'BIO6 — Tmín mes más frío', unit: '°C', range: [-10, 12], palette: BIO_PALETTE_TEMP },
  bio_07: { label: 'BIO7 — Rango temp. anual', unit: '°C', range: [10, 30], palette: BIO_PALETTE_DIVERGING },
  bio_08: { label: 'BIO8 — Tmedia trim. más húmedo', unit: '°C', range: [-2, 22], palette: BIO_PALETTE_TEMP },
  bio_09: { label: 'BIO9 — Tmedia trim. más seco', unit: '°C', range: [-2, 24], palette: BIO_PALETTE_TEMP },
  bio_10: { label: 'BIO10 — Tmedia trim. más cálido', unit: '°C', range: [2, 24], palette: BIO_PALETTE_TEMP },
  bio_11: { label: 'BIO11 — Tmedia trim. más frío', unit: '°C', range: [-4, 16], palette: BIO_PALETTE_TEMP },
  bio_12: { label: 'BIO12 — Precipitación anual', unit: 'mm', range: [0, 3000], palette: BIO_PALETTE_PREC },
  bio_13: { label: 'BIO13 — Precip. mes más húmedo', unit: 'mm', range: [0, 500], palette: BIO_PALETTE_PREC },
  bio_14: { label: 'BIO14 — Precip. mes más seco', unit: 'mm', range: [0, 80], palette: BIO_PALETTE_PREC },
  bio_15: { label: 'BIO15 — Estacionalidad precip.', unit: '%', range: [10, 130], palette: BIO_PALETTE_DIVERGING },
  bio_16: { label: 'BIO16 — Precip. trim. más húmedo', unit: 'mm', range: [0, 1200], palette: BIO_PALETTE_PREC },
  bio_17: { label: 'BIO17 — Precip. trim. más seco', unit: 'mm', range: [0, 250], palette: BIO_PALETTE_PREC },
  bio_18: { label: 'BIO18 — Precip. trim. más cálido', unit: 'mm', range: [0, 500], palette: BIO_PALETTE_PREC },
  bio_19: { label: 'BIO19 — Precip. trim. más frío', unit: 'mm', range: [0, 1500], palette: BIO_PALETTE_PREC },
};

Object.entries(BIOCLIM_META).forEach(([id, meta]) => {
  LAYER_CATALOG[id] = {
    ...meta,
    type: 'cog',
    cogVar: 'bio',
    bioIndex: parseInt(id.split('_')[1], 10),
    note: 'WorldClim 2.1 / CMIP6 (ACCESS-CM2 SSP245). Variable bioclimática anual.',
  };
});

function buildCogUrl(config) {
  const scenarioFolder = SCENARIO_TO_FOLDER[config.scenario];
  if (!scenarioFolder || !config.cogVar) return null;
  if (config.cogVar === 'bio') {
    return `${COG_BASE}/${scenarioFolder}/bio_${String(config.bioIndex).padStart(2, '0')}.tif`;
  }
  const month = String(config.month + 1).padStart(2, '0');
  return `${COG_BASE}/${scenarioFolder}/${config.cogVar}_${month}.tif`;
}

const CONTINENTAL_BOUNDS = L.latLngBounds([-44.5, -76], [-29, -68]);

const ICONS = {
  zoomIn:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  zoomOut:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M5 12h14"/></svg>',
  home:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/></svg>',
  refresh:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 4v5h-5"/></svg>',
  gps:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>',
  search:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="6"/><path d="M20 20l-3.5-3.5"/></svg>',
  query:
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 7c1.5-2 4-3 6-3s4.5 1 6 3l1 .5-1 .5c-1.5 2-4 3-6 3s-4.5-1-6-3l-1-.5L5 7zm-2 8a3 3 0 1 1 6 0 3 3 0 0 1-6 0zm12 0a3 3 0 1 1 6 0 3 3 0 0 1-6 0zM6 15a0 0 0 0 0 0 0zm12 0a0 0 0 0 0 0 0z" opacity="0"/><path d="M3 11h18v2H3z" opacity="0"/><path d="M5.5 7C7 5.3 9.4 4 12 4s5 1.3 6.5 3l1.5.7-1.5.8C17 10.2 14.6 11.5 12 11.5S7 10.2 5.5 9L4 8.3 5.5 7zM3 17a3 3 0 1 0 6 0 3 3 0 0 0-6 0zm12 0a3 3 0 1 0 6 0 3 3 0 0 0-6 0z"/></svg>',
  polygon:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><polygon points="12,3 21,9 18,20 6,20 3,9"/></svg>',
  marker:
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/></svg>',
  edit:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4l10-10-4-4L4 16v4z"/><path d="M14 6l4 4"/></svg>',
  trash:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M6 7l1 13h10l1-13"/></svg>',
  download:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M5 21h14"/></svg>',
  csv:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5" stroke-linecap="round"/><text x="12" y="17" text-anchor="middle" font-size="6" font-family="Inter,sans-serif" font-weight="700" fill="currentColor" stroke="none">CSV</text></svg>',
  collapse:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>',
};

const map = L.map('map', {
  zoomControl: false,
  minZoom: 5,
  maxZoom: 13,
  maxBounds: CONTINENTAL_BOUNDS,
  maxBoundsViscosity: 1,
}).setView(INITIAL_VIEW.center, INITIAL_VIEW.zoom);

const cartoVoyager = L.tileLayer(
  'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
  {
    maxZoom: 19,
    subdomains: 'abcd',
    crossOrigin: true,
    bounds: CONTINENTAL_BOUNDS,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
);

const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  bounds: CONTINENTAL_BOUNDS,
  attribution: '&copy; OpenStreetMap contributors',
});

const esriTopo = L.tileLayer(
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
  {
    maxZoom: 19,
    bounds: CONTINENTAL_BOUNDS,
    attribution: 'Tiles &copy; Esri, HERE, Garmin, FAO, NOAA, USGS, OpenStreetMap contributors',
  },
);

cartoVoyager.addTo(map);
L.control
  .layers(
    {
      'CARTO Voyager (rápido)': cartoVoyager,
      OpenStreetMap: osm,
      'Esri World Topographic': esriTopo,
    },
    {},
    { position: 'bottomleft' },
  )
  .addTo(map);
L.control.scale({ imperial: false, maxWidth: 240, position: 'bottomleft' }).addTo(map);

let climateLayer = null;
let regionesLayer = null;
let comunasLayer = null;
let activeAdmin = { name: 'Zona consultada', region: null, provincia: null, comuna: null };

const drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

let activeDrawHandler = null;

if (L.Control.Draw) {
  // Registramos el control para reusar sus handlers, pero el CSS lo oculta:
  // los botones quedan en nuestra toolbar custom.
  const drawControl = new L.Control.Draw({
    position: 'topleft',
    draw: {
      polyline: false,
      circle: false,
      circlemarker: false,
      marker: false,
      polygon: { allowIntersection: false, showArea: true },
      rectangle: false,
    },
    edit: { featureGroup: drawnItems, remove: false },
  });
  map.addControl(drawControl);

  map.on(L.Draw.Event.CREATED, async (event) => {
    const layer = event.layer;
    const layerType = event.layerType;
    drawnItems.addLayer(layer);
    activeDrawHandler = null;
    refreshToolbarState();

    if (layerType === 'polygon' || layerType === 'rectangle') {
      layer.bindPopup('<div class="popup-card"><h3>Calculando estadísticas…</h3></div>').openPopup();
      const stats = await computePolygonStats(layer);
      if (stats) {
        layer._stats = stats;
        layer.setPopupContent(buildStatsPopup(stats));
      } else {
        layer.setPopupContent(
          '<div class="popup-card"><h3>Geometría dibujada</h3><p>No hay raster activo (mock); estadísticas disponibles cuando se carguen COGs reales.</p></div>',
        );
      }
    } else {
      layer.bindPopup(`<div class="popup-card"><h3>Geometría dibujada</h3><p>Tipo: ${layerType}</p></div>`);
    }
  });
}

const variableSelect = document.querySelector('#variableSelect');
const scenarioSelect = document.querySelector('#scenarioSelect');
const monthSelect = document.querySelector('#monthSelect');
const monthCard = monthSelect.closest('.card');
const opacityRange = document.querySelector('#opacityRange');
const smoothToggle = document.querySelector('#smoothToggle');
const regionesToggle = document.querySelector('#regionesToggle');
const comunasToggle = document.querySelector('#comunasToggle');
const adminToggle = document.querySelector('#adminToggle');
const adminCard = document.querySelector('#adminCard');
const cardStack = document.querySelector('.card-stack');
const legendEl = document.querySelector('#legend');

// Inserta dinámicamente las 19 opciones BIO al select de variable.
const bioGroup = document.createElement('optgroup');
bioGroup.label = 'Bioclimáticas (anuales)';
Object.entries(BIOCLIM_META).forEach(([id, meta]) => {
  const opt = document.createElement('option');
  opt.value = id;
  opt.textContent = meta.label;
  bioGroup.appendChild(opt);
});
variableSelect.appendChild(bioGroup);

function isAnnualVariable(variableId) {
  const cfg = LAYER_CATALOG[variableId];
  return cfg?.cogVar === 'bio' || variableId === 'aptitud_nogal';
}

function updateMonthCardVisibility() {
  if (monthCard) monthCard.hidden = isAnnualVariable(variableSelect.value);
}

function getSelectedMonthIndex() {
  return Number(monthSelect.value);
}

function getOpacity() {
  return Number(opacityRange.value) / 100;
}

function resolveLayerConfig() {
  const variable = variableSelect.value;
  return {
    id: variable,
    ...LAYER_CATALOG[variable],
    scenario: scenarioSelect.value,
    month: getSelectedMonthIndex(),
    opacity: getOpacity(),
    smooth: smoothToggle.checked,
  };
}

let climateLoadToken = 0;

async function updateClimateLayer() {
  const config = resolveLayerConfig();
  const token = ++climateLoadToken;

  const layer = await loadClimateLayer(config);
  if (token !== climateLoadToken) return;  // hubo otro update mientras se cargaba

  if (climateLayer) map.removeLayer(climateLayer);
  climateLayer = layer.addTo(map);
  climateLayer.setZIndex?.(320);
  updateLegend(config);
  reorderOperationalLayers();
}

async function loadClimateLayer(config) {
  if (config.type === 'cog') {
    const cogLayer = await loadCogLayer(config);
    if (cogLayer) return cogLayer;
  }

  if (config.type === 'xyz' && config.url) {
    return L.tileLayer(config.url, { opacity: config.opacity, attribution: config.attribution ?? '' });
  }

  if (config.type === 'wms' && config.url) {
    return L.tileLayer.wms(config.url, {
      layers: config.layers,
      format: 'image/png',
      transparent: true,
      opacity: config.opacity,
    });
  }

  return loadMockLayer(config);
}

const georasterCache = new Map();

async function loadCogLayer(config) {
  if (typeof GeoRasterLayer === 'undefined' || typeof parseGeoraster === 'undefined') {
    console.warn('georaster-layer-for-leaflet no cargado; usando mock.');
    return null;
  }

  const url = buildCogUrl(config);
  if (!url) return null;

  let georaster;
  try {
    georaster = await fetchGeoraster(url);
  } catch (err) {
    console.warn(`COG no disponible (${url}). Cae a mock. Detalle:`, err.message);
    return null;
  }

  const [min, max] = config.range;
  const palette = config.palette;

  return new GeoRasterLayer({
    georaster,
    opacity: config.opacity,
    resolution: 96,
    pixelValuesToColorFn: (values) => {
      const v = values[0];
      if (v === null || v === undefined || isNaN(v) || v === georaster.noDataValue) return null;
      return interpolateColor(v, min, max, palette);
    },
  });
}

async function fetchGeoraster(url) {
  if (georasterCache.has(url)) return georasterCache.get(url);
  const promise = fetch(url, { cache: 'force-cache' })
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.arrayBuffer();
    })
    .then((buf) => parseGeoraster(buf));
  georasterCache.set(url, promise);
  try {
    return await promise;
  } catch (err) {
    georasterCache.delete(url);
    throw err;
  }
}

function interpolateColor(value, min, max, palette) {
  if (max === min) return palette[0];
  const t = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const idx = t * (palette.length - 1);
  const i = Math.floor(idx);
  const f = idx - i;
  if (i >= palette.length - 1) return palette[palette.length - 1];
  return mixHex(palette[i], palette[i + 1], f);
}

function mixHex(a, b, t) {
  const ar = parseInt(a.slice(1, 3), 16);
  const ag = parseInt(a.slice(3, 5), 16);
  const ab = parseInt(a.slice(5, 7), 16);
  const br = parseInt(b.slice(1, 3), 16);
  const bg = parseInt(b.slice(3, 5), 16);
  const bb = parseInt(b.slice(5, 7), 16);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const c = Math.round(ab + (bb - ab) * t);
  return `rgb(${r},${g},${c})`;
}

function loadMockLayer(config) {
  const bounds = [[-41.25, -74.2], [-34.05, -70.05]];
  const gradientStops = config.palette
    .map((color, index) => `<stop offset="${(index / (config.palette.length - 1)) * 100}%" stop-color="${color}"/>`)
    .join('');
  const ridgeGradientStops = ['rgba(255,255,255,0)', 'rgba(255,255,255,.55)', 'rgba(255,255,255,0)']
    .map((color, index) => `<stop offset="${index * 50}%" stop-color="${color}"/>`)
    .join('');
  const filter = config.smooth && config.id !== 'aptitud_nogal' ? 'filter="url(#soften)"' : '';

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1700" preserveAspectRatio="none">
      <defs>
        <linearGradient id="climateGradient" x1="0" y1="0" x2="0" y2="1">${gradientStops}</linearGradient>
        <linearGradient id="ridgeGradient" x1="0" y1="0" x2="1" y2="0">${ridgeGradientStops}</linearGradient>
        <filter id="soften"><feGaussianBlur stdDeviation="10"/></filter>
        <clipPath id="chileMask">
          <path d="M420 20 L575 72 L650 190 L625 320 L690 460 L650 610 L705 755 L660 930 L705 1085 L620 1280 L650 1470 L590 1665 L440 1638 L390 1490 L340 1365 L355 1185 L300 1040 L335 850 L275 680 L330 515 L300 350 L365 190 Z"/>
        </clipPath>
      </defs>
      <g clip-path="url(#chileMask)" opacity="${config.opacity}" ${filter}>
        <rect width="1000" height="1700" fill="url(#climateGradient)"/>
        <ellipse cx="610" cy="650" rx="150" ry="900" fill="url(#ridgeGradient)" opacity="0.55"/>
        <ellipse cx="405" cy="1170" rx="220" ry="430" fill="rgba(255,255,150,.28)"/>
        <ellipse cx="515" cy="1220" rx="120" ry="240" fill="rgba(60,160,130,.25)"/>
        <path d="M305 450 C430 560 475 670 390 810 C320 920 450 1070 365 1265" fill="none" stroke="rgba(255,255,255,.32)" stroke-width="48"/>
      </g>
      <path d="M420 20 L575 72 L650 190 L625 320 L690 460 L650 610 L705 755 L660 930 L705 1085 L620 1280 L650 1470 L590 1665 L440 1638 L390 1490 L340 1365 L355 1185 L300 1040 L335 850 L275 680 L330 515 L300 350 L365 190 Z" fill="none" stroke="rgba(120,120,120,.18)" stroke-width="3"/>
    </svg>`;

  return L.imageOverlay(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`, bounds, {
    opacity: 1,
    interactive: false,
    zIndex: 320,
  });
}

function updateLegend(config) {
  const scenarioLabel = config.scenario === 'baseline' ? 'línea base' : config.scenario;
  const isAnnual = config.id === 'aptitud_nogal' || config.cogVar === 'bio';
  const subtitle = isAnnual ? scenarioLabel : `${scenarioLabel} · ${MONTHS[config.month]}`;
  const title = `${config.label} (${config.unit})`;

  if (config.id === 'aptitud_nogal') {
    legendEl.innerHTML = `
      <h2>${title} · ${subtitle}</h2>
      <div class="legend-categories">
        ${config.range
          .map((label, index) => `<div class="legend-category"><span style="background:${config.palette[index]}"></span><span>${label}</span></div>`)
          .join('')}
      </div>
      <p class="legend-note">${config.note}</p>`;
    return;
  }

  const [min, max] = config.range;
  legendEl.innerHTML = `
    <h2>${title} · ${subtitle}</h2>
    <div class="legend-gradient" style="background: linear-gradient(90deg, ${config.palette.join(',')})"></div>
    <div class="legend-labels"><span>${min}</span><span>${max}</span></div>
    <p class="legend-note">${config.note}</p>`;
}

/* ---------- Toolbar custom (lado izquierdo) ---------- */

const toolButtons = new Map();

function renderToolButton(container, def) {
  const btn = L.DomUtil.create('button', 'tool-button', container);
  btn.type = 'button';
  btn.title = def.title;
  btn.setAttribute('aria-label', def.title);
  btn.innerHTML = ICONS[def.icon] ?? '';
  L.DomEvent.on(btn, 'click', L.DomEvent.stop).on(btn, 'click', () => def.onClick(btn));
  toolButtons.set(def.id, btn);
  return btn;
}

function makeToolbarGroup(buttons) {
  const control = L.control({ position: 'topleft' });
  control.onAdd = () => {
    const wrapper = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
    L.DomEvent.disableClickPropagation(wrapper);
    L.DomEvent.disableScrollPropagation(wrapper);
    buttons.forEach((def) => renderToolButton(wrapper, def));
    return wrapper;
  };
  control.addTo(map);
  return control;
}

function refreshToolbarState() {
  toolButtons.forEach((btn, id) => {
    if (id === 'admin') {
      btn.classList.toggle('is-active', !adminCard.hidden);
    } else if (id === 'polygon') {
      btn.classList.toggle('is-active', activeDrawHandler instanceof L.Draw.Polygon);
    } else if (id === 'marker') {
      btn.classList.toggle('is-active', false);
    }
  });
}

function startDraw(HandlerCtor) {
  activeDrawHandler?.disable?.();
  if (!HandlerCtor) {
    activeDrawHandler = null;
    refreshToolbarState();
    return;
  }
  activeDrawHandler = new HandlerCtor(map, { allowIntersection: false, showArea: true });
  activeDrawHandler.enable();
  refreshToolbarState();
}

function clearDrawnItems() {
  if (drawnItems.getLayers().length === 0) return;
  if (!confirm('¿Eliminar todos los marcadores y geometrías dibujadas?')) return;
  drawnItems.clearLayers();
}

function addManualMarker() {
  const marker = L.marker(map.getCenter(), { draggable: true })
    .bindPopup('Marcador manual<br>Arrastre para ajustar ubicación.')
    .addTo(drawnItems);
  marker.openPopup();
}

function toggleAdminCard() {
  adminCard.hidden = !adminCard.hidden;
  refreshToolbarState();
}

/* ---------- Estadísticas zonales por polígono ---------- */

function pointInRing(lon, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    const intersect = yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function pointInGeometry(lon, lat, geometry) {
  if (geometry.type === 'Polygon') {
    if (!pointInRing(lon, lat, geometry.coordinates[0])) return false;
    for (let h = 1; h < geometry.coordinates.length; h++) {
      if (pointInRing(lon, lat, geometry.coordinates[h])) return false;
    }
    return true;
  }
  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.some((poly) => pointInGeometry(lon, lat, { type: 'Polygon', coordinates: poly }));
  }
  return false;
}

function geometryBBox(geometry) {
  let xmin = Infinity;
  let ymin = Infinity;
  let xmax = -Infinity;
  let ymax = -Infinity;
  const visit = (coords) => {
    if (typeof coords[0] === 'number') {
      if (coords[0] < xmin) xmin = coords[0];
      if (coords[0] > xmax) xmax = coords[0];
      if (coords[1] < ymin) ymin = coords[1];
      if (coords[1] > ymax) ymax = coords[1];
      return;
    }
    coords.forEach(visit);
  };
  visit(geometry.coordinates);
  return { xmin, ymin, xmax, ymax };
}

function computeZonalStats(geometry, georaster) {
  const { xmin, ymax, pixelWidth, pixelHeight, width, height, noDataValue } = georaster;
  const data = georaster.values?.[0];
  if (!data) return null;

  const bbox = geometryBBox(geometry);
  const colStart = Math.max(0, Math.floor((bbox.xmin - xmin) / pixelWidth));
  const colEnd = Math.min(width - 1, Math.ceil((bbox.xmax - xmin) / pixelWidth));
  const rowStart = Math.max(0, Math.floor((ymax - bbox.ymax) / pixelHeight));
  const rowEnd = Math.min(height - 1, Math.ceil((ymax - bbox.ymin) / pixelHeight));

  let sum = 0;
  let sumSq = 0;
  let count = 0;
  let min = Infinity;
  let max = -Infinity;

  for (let row = rowStart; row <= rowEnd; row++) {
    const lat = ymax - (row + 0.5) * pixelHeight;
    const dataRow = data[row];
    if (!dataRow) continue;
    for (let col = colStart; col <= colEnd; col++) {
      const lon = xmin + (col + 0.5) * pixelWidth;
      if (!pointInGeometry(lon, lat, geometry)) continue;
      const v = dataRow[col];
      if (v === null || v === undefined || Number.isNaN(v) || v === noDataValue) continue;
      sum += v;
      sumSq += v * v;
      count++;
      if (v < min) min = v;
      if (v > max) max = v;
    }
  }

  if (count === 0) return null;
  const mean = sum / count;
  const variance = Math.max(0, sumSq / count - mean * mean);
  return { mean, min, max, std: Math.sqrt(variance), count };
}

async function computePolygonStats(layer) {
  const config = resolveLayerConfig();
  if (config.type !== 'cog') return null;

  const url = buildCogUrl(config);
  if (!url) return null;

  let georaster;
  try {
    georaster = await fetchGeoraster(url);
  } catch {
    return null;
  }

  const feature = layer.toGeoJSON();
  const stats = computeZonalStats(feature.geometry, georaster);
  if (!stats) return null;

  return {
    ...stats,
    variable: config.label,
    unit: config.unit,
    scenario: config.scenario === 'baseline' ? 'Línea base' : config.scenario,
    month: MONTHS[config.month],
  };
}

function buildStatsPopup(stats) {
  return `
    <div class="popup-card">
      <h3>Estadísticas zonales</h3>
      <dl>
        <dt>Variable</dt><dd>${stats.variable}</dd>
        <dt>Escenario</dt><dd>${stats.scenario}</dd>
        <dt>Mes</dt><dd>${stats.month}</dd>
        <dt>Media</dt><dd>${stats.mean.toFixed(2)} ${stats.unit}</dd>
        <dt>Mín</dt><dd>${stats.min.toFixed(2)} ${stats.unit}</dd>
        <dt>Máx</dt><dd>${stats.max.toFixed(2)} ${stats.unit}</dd>
        <dt>Desv. std</dt><dd>${stats.std.toFixed(2)}</dd>
        <dt>Píxeles</dt><dd>${stats.count}</dd>
      </dl>
    </div>`;
}

/* ---------- Exportación de dibujos ---------- */

function downloadFile(name, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function csvEscape(value) {
  const s = String(value ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function exportDrawnItems(format) {
  const features = [];
  drawnItems.eachLayer((layer) => {
    if (typeof layer.toGeoJSON !== 'function') return;
    const f = layer.toGeoJSON();
    if (layer._stats) {
      f.properties = { ...(f.properties || {}), ...layer._stats };
    }
    features.push(f);
  });

  if (features.length === 0) {
    alert('No hay geometrías dibujadas para exportar.');
    return;
  }

  const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);

  if (format === 'geojson') {
    const data = { type: 'FeatureCollection', features };
    downloadFile(`dibujos-${stamp}.geojson`, JSON.stringify(data, null, 2), 'application/geo+json');
    return;
  }

  if (format === 'csv') {
    const headers = ['type', 'variable', 'scenario', 'month', 'mean', 'min', 'max', 'std', 'count', 'unit'];
    const rows = features.map((f) => {
      const p = f.properties || {};
      return [
        f.geometry?.type ?? '',
        p.variable ?? '',
        p.scenario ?? '',
        p.month ?? '',
        p.mean?.toFixed?.(3) ?? '',
        p.min?.toFixed?.(3) ?? '',
        p.max?.toFixed?.(3) ?? '',
        p.std?.toFixed?.(3) ?? '',
        p.count ?? '',
        p.unit ?? '',
      ]
        .map(csvEscape)
        .join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    downloadFile(`dibujos-${stamp}.csv`, csv, 'text/csv');
  }
}

makeToolbarGroup([
  { id: 'zoomIn', title: 'Acercar', icon: 'zoomIn', onClick: () => map.zoomIn() },
  { id: 'zoomOut', title: 'Alejar', icon: 'zoomOut', onClick: () => map.zoomOut() },
]);

makeToolbarGroup([
  { id: 'home', title: 'Vista inicial', icon: 'home', onClick: () => map.fitBounds(INITIAL_VIEW.bounds) },
  {
    id: 'refresh',
    title: 'Refrescar capas',
    icon: 'refresh',
    onClick: () => {
      map.setView(INITIAL_VIEW.center, INITIAL_VIEW.zoom);
      updateClimateLayer();
    },
  },
  { id: 'gps', title: 'Ubicarme', icon: 'gps', onClick: () => map.locate({ setView: true, maxZoom: 10 }) },
  { id: 'search', title: 'Buscar lugar', icon: 'search', onClick: toggleSearchOverlay },
  { id: 'admin', title: 'Límites administrativos', icon: 'query', onClick: toggleAdminCard },
]);

makeToolbarGroup([
  {
    id: 'polygon',
    title: 'Dibujar polígono',
    icon: 'polygon',
    onClick: () => {
      if (activeDrawHandler instanceof L.Draw.Polygon) {
        startDraw(null);
      } else {
        startDraw(L.Draw.Polygon);
      }
    },
  },
  { id: 'marker', title: 'Agregar marcador', icon: 'marker', onClick: addManualMarker },
  {
    id: 'edit',
    title: 'Editar dibujos',
    icon: 'edit',
    onClick: () => {
      if (drawnItems.getLayers().length === 0) {
        alert('No hay geometrías dibujadas para editar.');
        return;
      }
      alert('Edición rápida: arrastra los marcadores para reubicarlos. Para edición avanzada de polígonos, próximamente.');
    },
  },
  { id: 'trash', title: 'Eliminar dibujos', icon: 'trash', onClick: clearDrawnItems },
]);

makeToolbarGroup([
  { id: 'exportGeoJSON', title: 'Exportar dibujos como GeoJSON', icon: 'download', onClick: () => exportDrawnItems('geojson') },
  { id: 'exportCSV', title: 'Exportar estadísticas como CSV', icon: 'csv', onClick: () => exportDrawnItems('csv') },
]);

/* ---------- Botón flotante para ocultar / mostrar todos los controles ---------- */

const collapseToggle = document.createElement('button');
collapseToggle.type = 'button';
collapseToggle.className = 'collapse-toggle';
collapseToggle.title = 'Mostrar controles';
collapseToggle.setAttribute('aria-label', 'Mostrar controles');
collapseToggle.innerHTML = ICONS.collapse;
document.querySelector('#app-shell').appendChild(collapseToggle);

const hideControlsBtn = document.createElement('button');
hideControlsBtn.type = 'button';
hideControlsBtn.className = 'card-hide-btn';
hideControlsBtn.title = 'Ocultar controles';
hideControlsBtn.setAttribute('aria-label', 'Ocultar controles');
hideControlsBtn.innerHTML = '&times;';
cardStack.insertBefore(hideControlsBtn, cardStack.firstChild);

function setControlsVisible(visible) {
  cardStack.hidden = !visible;
  legendEl.hidden = !visible;
  if (!visible) {
    const overlay = document.querySelector('#searchOverlay');
    if (overlay) overlay.hidden = true;
  }
  document
    .querySelectorAll('.leaflet-control-container .leaflet-top.leaflet-left, .leaflet-control-container .leaflet-bottom')
    .forEach((el) => {
      el.style.display = visible ? '' : 'none';
    });
  collapseToggle.classList.toggle('is-visible', !visible);
}

hideControlsBtn.addEventListener('click', () => setControlsVisible(false));
collapseToggle.addEventListener('click', () => setControlsVisible(true));

/* ---------- Búsqueda geográfica (Nominatim) ---------- */

const searchOverlay = document.querySelector('#searchOverlay');
const searchInput = document.querySelector('#searchInput');
const searchResults = document.querySelector('#searchResults');

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const SEARCH_DEBOUNCE_MS = 400;
let searchDebounceTimer = null;
let searchAbortController = null;
let searchMarker = null;

function toggleSearchOverlay() {
  const willShow = searchOverlay.hidden;
  searchOverlay.hidden = !willShow;
  toolButtons.get('search')?.classList.toggle('is-active', willShow);
  if (willShow) {
    searchInput.focus();
    searchInput.select();
  } else {
    searchResults.innerHTML = '';
  }
}

function renderSearchResults(items) {
  if (!items.length) {
    searchResults.innerHTML = '<li class="is-empty">Sin resultados</li>';
    return;
  }
  searchResults.innerHTML = items
    .map(
      (item, idx) =>
        `<li role="option" data-idx="${idx}" data-lat="${item.lat}" data-lon="${item.lon}">${escapeHtml(item.display_name)}</li>`,
    )
    .join('');
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

async function geocode(query) {
  searchAbortController?.abort();
  searchAbortController = new AbortController();

  const params = new URLSearchParams({
    format: 'json',
    countrycodes: 'cl',
    viewbox: `${CONTINENTAL_BOUNDS.getWest()},${CONTINENTAL_BOUNDS.getNorth()},${CONTINENTAL_BOUNDS.getEast()},${CONTINENTAL_BOUNDS.getSouth()}`,
    bounded: '1',
    limit: '5',
    q: query,
  });

  const res = await fetch(`${NOMINATIM_URL}?${params}`, {
    signal: searchAbortController.signal,
    headers: { 'Accept-Language': 'es' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

searchInput.addEventListener('input', () => {
  clearTimeout(searchDebounceTimer);
  const query = searchInput.value.trim();
  if (query.length < 3) {
    searchResults.innerHTML = '';
    return;
  }
  searchDebounceTimer = setTimeout(async () => {
    try {
      const items = await geocode(query);
      renderSearchResults(items);
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.warn('Geocoder falló:', err);
      searchResults.innerHTML = '<li class="is-empty">Error de búsqueda</li>';
    }
  }, SEARCH_DEBOUNCE_MS);
});

searchResults.addEventListener('click', (event) => {
  const li = event.target.closest('li[data-lat]');
  if (!li) return;
  const lat = Number(li.dataset.lat);
  const lon = Number(li.dataset.lon);
  if (Number.isNaN(lat) || Number.isNaN(lon)) return;

  if (searchMarker) map.removeLayer(searchMarker);
  searchMarker = L.marker([lat, lon])
    .bindPopup(`<strong>${li.textContent}</strong>`)
    .addTo(map)
    .openPopup();
  map.setView([lat, lon], 11);
  toggleSearchOverlay();
});

searchInput.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') toggleSearchOverlay();
});

/* ---------- Geolocalización ---------- */

map.on('locationfound', (event) => {
  L.circleMarker(event.latlng, {
    radius: 7,
    color: '#005bbb',
    fillColor: '#42a5ff',
    fillOpacity: 0.8,
  })
    .bindPopup(`Ubicación aproximada<br>Precisión: ${Math.round(event.accuracy)} m`)
    .addTo(drawnItems)
    .openPopup();
});

map.on('locationerror', () => alert('No fue posible obtener la ubicación desde el navegador.'));

/* ---------- Límites administrativos ---------- */

async function fetchFirstAvailable(urls) {
  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch {
      // sigue al siguiente fallback
    }
  }
  throw new Error(`Ningún path disponible: ${urls.join(', ')}`);
}

async function loadAdministrativeLayers() {
  try {
    const [regiones, comunas] = await Promise.all([
      fetchFirstAvailable(['assets/data/regiones.geojson', 'assets/data/mock-regiones.geojson']),
      fetchFirstAvailable(['assets/data/comunas.geojson', 'assets/data/mock-comunas.geojson']),
    ]);

    regionesLayer = L.geoJSON(regiones, {
      style: () => ({ color: '#ff1f1f', weight: 2, fillOpacity: 0, opacity: 0.95 }),
      onEachFeature: bindAdminFeature,
    });

    comunasLayer = L.geoJSON(comunas, {
      style: () => ({ color: '#5f6f73', weight: 0.8, fillOpacity: 0, opacity: 0.75 }),
      onEachFeature: bindAdminFeature,
    });

    updateAdministrativeVisibility();
    reorderOperationalLayers();
  } catch (err) {
    console.warn('No fue posible cargar límites administrativos:', err.message);
  }
}

function adminInfoFromFeature(feature) {
  const p = feature.properties || {};
  return {
    region: p.Region ?? p.region ?? p.NOM_REG ?? null,
    provincia: p.Provincia ?? p.provincia ?? p.NOM_PROV ?? null,
    comuna: p.Comuna ?? p.comuna ?? p.NOM_COM ?? null,
  };
}

function bindAdminFeature(feature, layer) {
  const info = adminInfoFromFeature(feature);
  const name = info.comuna ?? info.provincia ?? info.region ?? 'Límite administrativo';

  layer.on('mouseover', () => {
    activeAdmin = { name, region: info.region, provincia: info.provincia, comuna: info.comuna };
  });
  layer.on('mouseout', () => {
    activeAdmin = { name: 'Zona consultada', region: null, provincia: null, comuna: null };
  });

  const rows = [
    info.region ? `<dt>Región</dt><dd>${info.region}</dd>` : '',
    info.provincia ? `<dt>Provincia</dt><dd>${info.provincia}</dd>` : '',
    info.comuna ? `<dt>Comuna</dt><dd>${info.comuna}</dd>` : '',
  ].join('');
  layer.bindPopup(`<div class="popup-card"><h3>${name}</h3><dl>${rows}</dl></div>`);
}

function updateAdministrativeVisibility() {
  const showAdmin = adminToggle.checked;
  const showRegions = showAdmin && regionesToggle.checked;
  const showCommunes = showAdmin && comunasToggle.checked;

  if (regionesLayer) {
    showRegions ? regionesLayer.addTo(map) : map.removeLayer(regionesLayer);
  }

  if (comunasLayer) {
    showCommunes ? comunasLayer.addTo(map) : map.removeLayer(comunasLayer);
  }
}

function reorderOperationalLayers() {
  climateLayer?.bringToBack?.();
  comunasLayer?.bringToFront?.();
  regionesLayer?.bringToFront?.();
  drawnItems.bringToFront();
}

/* ---------- Popups con valor mock ---------- */

function getMockClimateValue(lat, lng, config) {
  const northSouth = Math.max(0, Math.min(1, (lat + 41.4) / 7.4));
  const coastCordillera = Math.max(0, Math.min(1, (lng + 74.4) / 4.7));
  const scenarioDelta = { baseline: 0, 2030: 0.08, 2050: 0.17, 2070: 0.28 }[config.scenario] ?? 0;
  const seasonal = Math.cos(((config.month - 6) / 12) * Math.PI * 2);

  if (config.id === 'precipitacion') {
    const value = 35 + (1 - northSouth) * 155 + seasonal * 45 - scenarioDelta * 55 + coastCordillera * 18;
    return `${Math.max(0, Math.round(value))} mm`;
  }

  if (config.id === 'temp_min') {
    const value = -2 + northSouth * 13 + seasonal * 4.5 + scenarioDelta * 5 - coastCordillera * 3.2;
    return `${value.toFixed(1)} °C`;
  }

  if (config.id === 'temp_media') {
    const value = 7 + northSouth * 12 + seasonal * 5.2 + scenarioDelta * 5.5 - coastCordillera * 2.6;
    return `${value.toFixed(1)} °C`;
  }

  if (config.id === 'temp_max') {
    const value = 14 + northSouth * 14 + seasonal * 6.6 + scenarioDelta * 6.2 - coastCordillera * 2.1;
    return `${value.toFixed(1)} °C`;
  }

  if (config.id === 'aptitud_nogal') {
    const score = 0.55 + northSouth * 0.25 - Math.abs(coastCordillera - 0.42) * 0.7 - Math.abs(seasonal) * 0.06 - scenarioDelta * 0.12;
    if (score > 0.75) return 'Muy alta';
    if (score > 0.6) return 'Alta';
    if (score > 0.45) return 'Media';
    if (score > 0.3) return 'Baja';
    return 'No apta';
  }

  if (config.cogVar === 'bio') {
    const [min, max] = config.range;
    const value = min + northSouth * (max - min) * 0.7 + coastCordillera * (max - min) * 0.2;
    return `${value.toFixed(1)} ${config.unit}`;
  }

  return '—';
}

function formatPopupContent(latlng) {
  const config = resolveLayerConfig();
  const value = getMockClimateValue(latlng.lat, latlng.lng, config);
  const adminRows = [
    activeAdmin.region ? `<dt>Región</dt><dd>${activeAdmin.region}</dd>` : '',
    activeAdmin.provincia ? `<dt>Provincia</dt><dd>${activeAdmin.provincia}</dd>` : '',
    activeAdmin.comuna ? `<dt>Comuna</dt><dd>${activeAdmin.comuna}</dd>` : '',
  ].join('');
  const isAnnual = config.id === 'aptitud_nogal' || config.cogVar === 'bio';
  const monthRow = isAnnual ? '' : `<dt>Mes</dt><dd>${MONTHS[config.month]}</dd>`;
  return `
    <div class="popup-card">
      <h3>${activeAdmin.name}</h3>
      <dl>
        ${adminRows}
        <dt>Coordenadas</dt><dd>${latlng.lng.toFixed(5)}, ${latlng.lat.toFixed(5)}</dd>
        <dt>Variable</dt><dd>${config.label}</dd>
        <dt>Escenario</dt><dd>${config.scenario === 'baseline' ? 'Línea base' : config.scenario}</dd>
        ${monthRow}
        <dt>Valor</dt><dd>${value}</dd>
      </dl>
    </div>`;
}

map.on('click', (event) => {
  if (activeDrawHandler) return;
  L.popup({ maxWidth: 285 })
    .setLatLng(event.latlng)
    .setContent(formatPopupContent(event.latlng))
    .openOn(map);
});

/* ---------- Eventos de UI ---------- */

[variableSelect, scenarioSelect, monthSelect, opacityRange, smoothToggle].forEach((control) => {
  control.addEventListener('change', updateClimateLayer);
  control.addEventListener('input', updateClimateLayer);
});

variableSelect.addEventListener('change', updateMonthCardVisibility);

[regionesToggle, comunasToggle].forEach((control) => {
  control.addEventListener('change', () => {
    adminToggle.checked = regionesToggle.checked || comunasToggle.checked;
    updateAdministrativeVisibility();
    reorderOperationalLayers();
  });
});

map.whenReady(() => {
  map.fitBounds(INITIAL_VIEW.bounds);
  updateMonthCardVisibility();
  updateClimateLayer();
  loadAdministrativeLayers();
  refreshToolbarState();
});
