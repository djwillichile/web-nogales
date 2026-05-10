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

const LAYER_CATALOG = {
  precipitacion: {
    label: 'Precipitación mensual',
    unit: 'mm',
    range: [0, 260],
    resampling: 'bilinear/average para visualización',
    palette: ['#9e0142', '#d53e4f', '#f46d43', '#fdae61', '#fee08b', '#abdda4', '#66c2a5', '#3288bd'],
    note: 'Mock continuo. En producción usar COG/tiles por mes y escenario.',
    type: 'mock',
  },
  temp_min: {
    label: 'Temperatura mínima media',
    unit: '°C',
    range: [-4, 16],
    resampling: 'bilinear/cubic para visualización',
    palette: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffbf', '#fdae61', '#f46d43', '#a50026'],
    note: 'Paleta térmica frío-calor para temperatura mínima.',
    type: 'mock',
  },
  temp_media: {
    label: 'Temperatura media',
    unit: '°C',
    range: [2, 24],
    resampling: 'bilinear/cubic para visualización',
    palette: ['#2c7bb6', '#00a6ca', '#00ccbc', '#90eb9d', '#ffff8c', '#f9d057', '#f29e2e', '#e76818', '#d7191c'],
    note: 'Paleta térmica continua. Suavizado solo visual.',
    type: 'mock',
  },
  temp_max: {
    label: 'Temperatura máxima media',
    unit: '°C',
    range: [8, 36],
    resampling: 'bilinear/cubic para visualización',
    palette: ['#4575b4', '#91bfdb', '#e0f3f8', '#ffffbf', '#fee090', '#fc8d59', '#d73027', '#7f0000'],
    note: 'Paleta térmica enfatizando máximas estivales.',
    type: 'mock',
  },
  aptitud_nogal: {
    label: 'Aptitud de nogal',
    unit: 'categoría',
    range: ['No apta', 'Baja', 'Media', 'Alta', 'Muy alta'],
    resampling: 'nearest/mode; no usar bilinear en categorías',
    palette: ['#b2182b', '#ef8a62', '#fddbc7', '#d9f0d3', '#1a9850'],
    note: 'Capa categórica mock. Mantener clases discretas en producción.',
    type: 'mock',
  },
  bioclimaticas: {
    label: 'Variables bioclimáticas',
    unit: 'índice',
    range: [0, 1],
    resampling: 'bilinear/average si es variable continua',
    palette: ['#5e4fa2', '#3288bd', '#66c2a5', '#abdda4', '#e6f598', '#fee08b', '#fdae61', '#f46d43', '#9e0142'],
    note: 'Índice bioclimático mock preparado para BIO1–BIO19 u otros índices.',
    type: 'mock',
  },
};

const CONTINENTAL_BOUNDS = L.latLngBounds([-44.5, -76], [-29, -68]);

const map = L.map('map', {
  zoomControl: true,
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
L.control.scale({ imperial: false, maxWidth: 300 }).addTo(map);

let climateLayer = null;
let regionesLayer = null;
let comunasLayer = null;
let activeAdminName = 'Zona consultada';

const drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

if (L.Control.Draw) {
  const drawControl = new L.Control.Draw({
    position: 'topleft',
    draw: {
      polyline: false,
      circle: false,
      circlemarker: false,
      marker: true,
      polygon: { allowIntersection: false, showArea: true },
      rectangle: true,
    },
    edit: { featureGroup: drawnItems, remove: true },
  });
  map.addControl(drawControl);

  map.on(L.Draw.Event.CREATED, (event) => {
    const layer = event.layer;
    const layerType = event.layerType;
    layer.bindPopup(`<strong>Geometría dibujada</strong><br>Tipo: ${layerType}<br>Exportación GeoJSON pendiente.`);
    drawnItems.addLayer(layer);
  });
}

const variableSelect = document.querySelector('#variableSelect');
const scenarioSelect = document.querySelector('#scenarioSelect');
const opacityRange = document.querySelector('#opacityRange');
const opacityValue = document.querySelector('#opacityValue');
const smoothToggle = document.querySelector('#smoothToggle');
const regionesToggle = document.querySelector('#regionesToggle');
const comunasToggle = document.querySelector('#comunasToggle');
const adminToggle = document.querySelector('#adminToggle');
const panelToggle = document.querySelector('#panelToggle');
const controlPanel = document.querySelector('#control-panel');

function getSelectedMonthIndex() {
  return Number(document.querySelector('input[name="month"]:checked')?.value ?? 0);
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

function updateClimateLayer() {
  const config = resolveLayerConfig();

  if (climateLayer) {
    map.removeLayer(climateLayer);
  }

  climateLayer = loadClimateLayer(config).addTo(map);
  climateLayer.setZIndex?.(320);
  opacityValue.textContent = `${Math.round(config.opacity * 100)}%`;
  updateLegend(config);
  reorderOperationalLayers();
}

function loadClimateLayer(config) {
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

function loadMockLayer(config) {
  // SVG suave: reemplazar por tiles reales COG/WMS/XYZ cuando existan rasters productivos.
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
  const legend = document.querySelector('#legend');
  const title = `${config.label} · ${config.scenario === 'baseline' ? 'línea base' : config.scenario} · ${MONTHS[config.month]}`;

  if (config.id === 'aptitud_nogal') {
    legend.innerHTML = `
      <h2>${title}</h2>
      <div class="legend-categories">
        ${config.range
          .map((label, index) => `<div class="legend-category"><span style="background:${config.palette[index]}"></span><span>${label}</span></div>`)
          .join('')}
      </div>
      <p class="legend-note">Resolución mock 1 km. Variable categórica: usar nearest/mode, sin suavizado bilinear.</p>`;
    return;
  }

  const [min, max] = config.range;
  legend.innerHTML = `
    <h2>${title}</h2>
    <div class="legend-gradient" style="background: linear-gradient(90deg, ${config.palette.join(',')})"></div>
    <div class="legend-labels"><span>${min} ${config.unit}</span><span>${max} ${config.unit}</span></div>
    <p class="legend-note">${config.note} Resolución mock 1 km; suavizado solo visual.</p>`;
}

function addToolControl(buttons) {
  const control = L.control({ position: 'topleft' });
  control.onAdd = () => {
    const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
    buttons.forEach((button) => {
      const el = L.DomUtil.create('button', 'tool-button', container);
      el.type = 'button';
      el.title = button.title;
      el.setAttribute('aria-label', button.title);
      el.innerHTML = button.icon;
      L.DomEvent.on(el, 'click', L.DomEvent.stop).on(el, 'click', button.onClick);
    });
    return container;
  };
  control.addTo(map);
}

addToolControl([
  { title: 'Vista inicial', icon: '⌂', onClick: () => map.fitBounds(INITIAL_VIEW.bounds) },
  { title: 'Refrescar capas', icon: '⟳', onClick: () => { map.setView(INITIAL_VIEW.center, INITIAL_VIEW.zoom); updateClimateLayer(); } },
  { title: 'Ubicarme', icon: '⌖', onClick: () => map.locate({ setView: true, maxZoom: 10 }) },
  { title: 'Buscar lugar (preparado)', icon: '⌕', onClick: () => alert('Búsqueda geográfica preparada para geocoder futuro.') },
  { title: 'Consulta espacial', icon: '▣', onClick: () => alert('Haga clic sobre el mapa para consultar valores simulados.') },
  { title: 'Agregar marcador', icon: '⌾', onClick: addManualMarker },
]);

function addManualMarker() {
  const marker = L.marker(map.getCenter(), { draggable: true })
    .bindPopup('Marcador manual<br>Arrastre para ajustar ubicación.')
    .addTo(drawnItems);
  marker.openPopup();
}

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

function loadAdministrativeLayers() {
  Promise.all([
    fetch('assets/data/mock-regiones.geojson').then((response) => response.json()),
    fetch('assets/data/mock-comunas.geojson').then((response) => response.json()),
  ])
    .then(([regiones, comunas]) => {
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
    })
    .catch(() => {
      alert('No fue posible cargar límites administrativos mock. Use servidor local, no file://.');
    });
}

function bindAdminFeature(feature, layer) {
  const name = feature.properties?.name ?? feature.properties?.NOMBRE ?? 'Límite administrativo';
  layer.on('mouseover', () => { activeAdminName = name; });
  layer.on('mouseout', () => { activeAdminName = 'Zona consultada'; });
  layer.bindPopup(`<strong>${name}</strong><br>Límite administrativo mock no oficial.`);
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

  const value = 0.25 + northSouth * 0.45 + coastCordillera * 0.15 - scenarioDelta * 0.08;
  return `${Math.max(0, Math.min(1, value)).toFixed(2)} índice`;
}

function formatPopupContent(latlng) {
  const config = resolveLayerConfig();
  const value = getMockClimateValue(latlng.lat, latlng.lng, config);
  return `
    <div class="popup-card">
      <h3>${activeAdminName}</h3>
      <dl>
        <dt>Coordenadas</dt><dd>${latlng.lng.toFixed(5)}, ${latlng.lat.toFixed(5)}</dd>
        <dt>Variable</dt><dd>${config.label}</dd>
        <dt>Escenario</dt><dd>${config.scenario === 'baseline' ? 'Línea base' : config.scenario}</dd>
        <dt>Mes</dt><dd>${MONTHS[config.month]}</dd>
        <dt>Valor</dt><dd>${value}</dd>
      </dl>
    </div>`;
}

map.on('click', (event) => {
  L.popup({ maxWidth: 285 })
    .setLatLng(event.latlng)
    .setContent(formatPopupContent(event.latlng))
    .openOn(map);
});

[variableSelect, scenarioSelect, opacityRange, smoothToggle].forEach((control) => {
  control.addEventListener('change', updateClimateLayer);
  control.addEventListener('input', updateClimateLayer);
});

document.querySelectorAll('input[name="month"]').forEach((radio) => {
  radio.addEventListener('change', updateClimateLayer);
});

[adminToggle, regionesToggle, comunasToggle].forEach((control) => {
  control.addEventListener('change', () => {
    if (!adminToggle.checked) {
      regionesToggle.checked = false;
      comunasToggle.checked = false;
    }
    if (control !== adminToggle && (regionesToggle.checked || comunasToggle.checked)) {
      adminToggle.checked = true;
    }
    updateAdministrativeVisibility();
    reorderOperationalLayers();
  });
});

panelToggle.addEventListener('click', () => {
  const isCollapsed = controlPanel.classList.toggle('is-collapsed');
  panelToggle.setAttribute('aria-expanded', String(!isCollapsed));
});

map.whenReady(() => {
  map.fitBounds(INITIAL_VIEW.bounds);
  updateClimateLayer();
  loadAdministrativeLayers();
});
