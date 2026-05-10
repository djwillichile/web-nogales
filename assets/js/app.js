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
let activeAdminName = 'Zona consultada';

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

  map.on(L.Draw.Event.CREATED, (event) => {
    const layer = event.layer;
    const layerType = event.layerType;
    layer.bindPopup(`<strong>Geometría dibujada</strong><br>Tipo: ${layerType}<br>Exportación GeoJSON pendiente.`);
    drawnItems.addLayer(layer);
    activeDrawHandler = null;
    refreshToolbarState();
  });
}

const variableSelect = document.querySelector('#variableSelect');
const scenarioSelect = document.querySelector('#scenarioSelect');
const monthSelect = document.querySelector('#monthSelect');
const opacityRange = document.querySelector('#opacityRange');
const smoothToggle = document.querySelector('#smoothToggle');
const regionesToggle = document.querySelector('#regionesToggle');
const comunasToggle = document.querySelector('#comunasToggle');
const adminToggle = document.querySelector('#adminToggle');
const adminCard = document.querySelector('#adminCard');
const cardStack = document.querySelector('.card-stack');
const legendEl = document.querySelector('#legend');

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

function updateClimateLayer() {
  const config = resolveLayerConfig();

  if (climateLayer) {
    map.removeLayer(climateLayer);
  }

  climateLayer = loadClimateLayer(config).addTo(map);
  climateLayer.setZIndex?.(320);
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
  const subtitle =
    config.id === 'aptitud_nogal'
      ? `${config.scenario === 'baseline' ? 'línea base' : config.scenario}`
      : `${config.scenario === 'baseline' ? 'línea base' : config.scenario} · ${MONTHS[config.month]}`;
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
  {
    id: 'search',
    title: 'Buscar lugar (preparado)',
    icon: 'search',
    onClick: () => alert('Búsqueda geográfica preparada para geocoder futuro.'),
  },
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
  document
    .querySelectorAll('.leaflet-control-container .leaflet-top.leaflet-left, .leaflet-control-container .leaflet-bottom')
    .forEach((el) => {
      el.style.display = visible ? '' : 'none';
    });
  collapseToggle.classList.toggle('is-visible', !visible);
}

hideControlsBtn.addEventListener('click', () => setControlsVisible(false));
collapseToggle.addEventListener('click', () => setControlsVisible(true));

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

[regionesToggle, comunasToggle].forEach((control) => {
  control.addEventListener('change', () => {
    adminToggle.checked = regionesToggle.checked || comunasToggle.checked;
    updateAdministrativeVisibility();
    reorderOperationalLayers();
  });
});

map.whenReady(() => {
  map.fitBounds(INITIAL_VIEW.bounds);
  updateClimateLayer();
  loadAdministrativeLayers();
  refreshToolbarState();
});
