function openPage(pageId) {
  document.querySelectorAll(".page").forEach(page => {
    page.classList.remove("active");
  });

  const target = document.getElementById(pageId);
  if (target) target.classList.add("active");

  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.page === pageId);
  });

  setTimeout(() => {
    if (pageId === "vfrPlanner") {
      initVfrMap();
      if (vfrMap) vfrMap.updateSize();
    }
  }, 150);
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => openPage(btn.dataset.page));
  });

  loadSavedLanguage();
});

function convertValue() {
  const type = document.getElementById("convertType").value;
  const input = document.getElementById("convertInput");
  const resultBox = document.getElementById("convertResult");

  const value = Number(input.value);

  if (input.value === "" || isNaN(value)) {
    resultBox.textContent = t("enterNumber");
    return;
  }

  let result;
  let text;

  switch (type) {
    case "ft-m":
      result = value * 0.3048;
      text = `${value} ft = ${result.toFixed(2)} m`;
      break;
    case "m-ft":
      result = value / 0.3048;
      text = `${value} m = ${result.toFixed(2)} ft`;
      break;
    case "kg-t":
      result = value / 1000;
      text = `${value} kg = ${result.toFixed(3)} t`;
      break;
    case "t-kg":
      result = value * 1000;
      text = `${value} t = ${result.toFixed(0)} kg`;
      break;
    case "hpa-inhg":
      result = value * 0.0295299830714;
      text = `${value} hPa = ${result.toFixed(2)} inHg`;
      break;
    case "inhg-hpa":
      result = value / 0.0295299830714;
      text = `${value} inHg = ${result.toFixed(0)} hPa`;
      break;
    default:
      text = t("unknownConversion");
  }

  resultBox.textContent = text;
}

async function quickMetar() {
  const input = document.getElementById("quickIcao");
  const result = document.getElementById("quickMetarResult");
  await fetchMetar(input.value, result);
}

async function getMetar() {
  const input = document.getElementById("icaoInput");
  const result = document.getElementById("metarResult");
  await fetchMetar(input.value, result);
}

async function fetchMetar(icaoRaw, resultBox) {
  const icao = icaoRaw.trim().toUpperCase();

  if (icao.length !== 4) {
    resultBox.textContent = t("enterIcao");
    return;
  }

  resultBox.innerHTML = `${t("metarInsideError")}\n\n${t("metarExternalHint")}`;
}

function openMetarExternal(inputId) {
  const input = document.getElementById(inputId);
  const icao = input.value.trim().toUpperCase();

  if (icao.length !== 4) {
    alert(t("enterIcao"));
    return;
  }

  window.open(
    `https://aviationweather.gov/api/data/metar?ids=${icao}&format=json`,
    "_blank"
  );
}

function createTopoLayer() {
  return new ol.layer.Tile({
    source: new ol.source.OSM({
      attributions: "© OpenStreetMap contributors"
    })
  });
}

let vfrMap;
let vfrDrawSource;
let vfrDrawLayer;
let vfrSelect;
let vfrDraw;
let vfrModifyEdit;
let vfrModifyDelPoint;
let vfrTranslate;
let vfrDeleteLineMode = false;

function initVfrMap() {
  if (vfrMap) return;

  vfrDrawSource = new ol.source.Vector();

  vfrDrawLayer = new ol.layer.Vector({
    source: vfrDrawSource,
    style: new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: "#111111",
        width: 4
      })
    })
  });

  vfrMap = new ol.Map({
    target: "vfrMapCanvas",
    layers: [createTopoLayer(), vfrDrawLayer],
    view: new ol.View({
      center: ol.proj.fromLonLat([0, 20]),
      zoom: 2
    })
  });

  vfrSelect = new ol.interaction.Select({
    layers: [vfrDrawLayer],
    hitTolerance: 6
  });

  vfrDraw = new ol.interaction.Draw({
    source: vfrDrawSource,
    type: "LineString"
  });

  vfrModifyEdit = new ol.interaction.Modify({
    source: vfrDrawSource
  });

  vfrModifyDelPoint = new ol.interaction.Modify({
    source: vfrDrawSource,
    deleteCondition: event => ol.events.condition.singleClick(event),
    insertVertexCondition: () => false
  });

  vfrTranslate = new ol.interaction.Translate({
    features: vfrSelect.getFeatures()
  });

  vfrMap.on("singleclick", evt => {
    if (!vfrDeleteLineMode) return;

    vfrMap.forEachFeatureAtPixel(evt.pixel, (feature, layer) => {
      if (layer === vfrDrawLayer) {
        vfrDrawSource.removeFeature(feature);
        vfrSelect.getFeatures().clear();
        return true;
      }
    }, { hitTolerance: 6 });
  });

  setupVfrToolbar();
  setupTooltips();

  const drawBtn = document.getElementById("btnDraw");
  if (drawBtn) drawBtn.click();
}

function deactivateVfrTools() {
  vfrMap.removeInteraction(vfrDraw);
  vfrMap.removeInteraction(vfrModifyEdit);
  vfrMap.removeInteraction(vfrModifyDelPoint);
  vfrMap.removeInteraction(vfrSelect);
  vfrMap.removeInteraction(vfrTranslate);

  vfrDeleteLineMode = false;

  document.querySelectorAll(".tool").forEach(btn => {
    btn.classList.remove("active");
  });
}

function activateTool(btn) {
  document.querySelectorAll(".tool").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
}

function setupVfrToolbar() {
  const btnDraw = document.getElementById("btnDraw");
  const btnEdit = document.getElementById("btnEdit");
  const btnDelPt = document.getElementById("btnDelPt");
  const btnMove = document.getElementById("btnMove");
  const btnDelete = document.getElementById("btnDelete");
  const btnClear = document.getElementById("btnClear");

  btnDraw.onclick = () => {
    deactivateVfrTools();
    vfrMap.addInteraction(vfrDraw);
    activateTool(btnDraw);
  };

  btnEdit.onclick = () => {
    deactivateVfrTools();
    vfrMap.addInteraction(vfrModifyEdit);
    activateTool(btnEdit);
  };

  btnDelPt.onclick = () => {
    deactivateVfrTools();
    vfrMap.addInteraction(vfrModifyDelPoint);
    activateTool(btnDelPt);
  };

  btnMove.onclick = () => {
    deactivateVfrTools();
    vfrMap.addInteraction(vfrSelect);
    vfrMap.addInteraction(vfrTranslate);
    activateTool(btnMove);
  };

  btnDelete.onclick = () => {
    deactivateVfrTools();
    vfrDeleteLineMode = true;
    activateTool(btnDelete);
  };

  btnClear.onclick = () => {
    if (confirm(t("clearConfirm"))) {
      vfrDrawSource.clear();
      vfrSelect.getFeatures().clear();
    }
  };
}

function setupTooltips() {
  const tooltip = document.getElementById("tooltip");
  if (!tooltip) return;

  document.querySelectorAll(".tool").forEach(el => {
    el.addEventListener("mouseenter", e => {
      const text = el.dataset.tip;
      if (!text) return;

      tooltip.textContent = text;
      tooltip.style.left = e.clientX + 12 + "px";
      tooltip.style.top = e.clientY + 12 + "px";
      tooltip.classList.add("show");
    });

    el.addEventListener("mousemove", e => {
      tooltip.style.left = e.clientX + 12 + "px";
      tooltip.style.top = e.clientY + 12 + "px";
    });

    el.addEventListener("mouseleave", () => {
      tooltip.classList.remove("show");
    });
  });
}

function toggleCompass(type) {
  const id = "vfrCompass";
  const compass = document.getElementById(id);
  if (compass) compass.classList.toggle("hidden");
}

const translations = {
  ru: {
    subtitle: "Flight Tools",
    home: "Главная",
    metar: "METAR",
    vfrPlanner: "VFR Планер",
    about: "О сайте",
    mainTitle: "AeroNav23 Flight Tools",
    mainDescription: "Инструменты для авиасимуляторов: конвертеры, METAR и VFR Planner.",
    converter: "Конвертер",
    conversionType: "Тип конвертации",
    value: "Значение",
    valuePlaceholder: "Например: 1013",
    feetToMeters: "Футы → Метры",
    metersToFeet: "Метры → Футы",
    kgToTons: "Килограммы → Тонны",
    tonsToKg: "Тонны → Килограммы",
    hpaToInhg: "hPa → inHg",
    inhgToHpa: "inHg → hPa",
    convertBtn: "Конвертировать",
    convertResult: "Результат появится здесь",
    quickMetar: "Быстрый METAR",
    icao: "ICAO",
    icaoCode: "ICAO-код",
    icaoPlaceholder: "OMDB",
    icaoPlaceholderLong: "Например: OMDB",
    getMetar: "Получить METAR",
    openOfficialMetar: "Открыть официальный METAR",
    metarResult: "METAR появится здесь",
    metarDescription: "Введите ICAO-код аэропорта, например OMDB, EGLL, KLAX, URSS.",
    aboutText: "AeroNav23 Flight Tools — бесплатный набор инструментов для авиасимуляторов: METAR, конвертеры и VFR Planner.",
    simulationOnly: "⚠️ Только для симуляторов. Не использовать для реальной авиации.",
    dataSources: "Использовано",
    language: "Language:",
    enterNumber: "Введите число.",
    unknownConversion: "Неизвестный тип конвертации.",
    enterIcao: "Введите ICAO-код из 4 букв.",
    metarInsideError: "METAR внутри сайта временно отключён.",
    metarExternalHint: "Нажмите кнопку «Открыть официальный METAR».",
    clearConfirm: "Удалить все линии?",
    tipDraw: "Линия: клик — точки, двойной клик — закончить",
    tipEdit: "Редактировать точки",
    tipDeletePoint: "Удалить точку",
    tipMove: "Передвинуть линию",
    tipDeleteLine: "Удалить линию",
    tipClear: "Очистить всё",
    tipCompass: "Градусная шкала"
  },
  en: {
    subtitle: "Flight Tools",
    home: "Home",
    metar: "METAR",
    vfrPlanner: "VFR Planner",
    about: "About",
    mainTitle: "AeroNav23 Flight Tools",
    mainDescription: "Tools for flight simulators: converters, METAR and VFR Planner.",
    converter: "Converter",
    conversionType: "Conversion type",
    value: "Value",
    valuePlaceholder: "Example: 1013",
    feetToMeters: "Feet → Meters",
    metersToFeet: "Meters → Feet",
    kgToTons: "Kilograms → Tons",
    tonsToKg: "Tons → Kilograms",
    hpaToInhg: "hPa → inHg",
    inhgToHpa: "inHg → hPa",
    convertBtn: "Convert",
    convertResult: "Result will appear here",
    quickMetar: "Quick METAR",
    icao: "ICAO",
    icaoCode: "ICAO code",
    icaoPlaceholder: "OMDB",
    icaoPlaceholderLong: "Example: OMDB",
    getMetar: "Get METAR",
    openOfficialMetar: "Open official METAR",
    metarResult: "METAR will appear here",
    metarDescription: "Enter airport ICAO code, for example OMDB, EGLL, KLAX, URSS.",
    aboutText: "AeroNav23 Flight Tools is a free toolkit for flight simulators: METAR, converters and VFR Planner.",
    simulationOnly: "⚠️ Simulation use only. Not for real-world aviation.",
    dataSources: "Data sources",
    language: "Language:",
    enterNumber: "Enter a number.",
    unknownConversion: "Unknown conversion type.",
    enterIcao: "Enter a 4-letter ICAO code.",
    metarInsideError: "METAR inside the website is temporarily disabled.",
    metarExternalHint: "Press the “Open official METAR” button.",
    clearConfirm: "Delete all lines?",
    tipDraw: "Line: click to add points, double-click to finish",
    tipEdit: "Edit points",
    tipDeletePoint: "Delete point",
    tipMove: "Move line",
    tipDeleteLine: "Delete line",
    tipClear: "Clear all",
    tipCompass: "Compass overlay"
  },
  de: {
    subtitle: "Flugwerkzeuge",
    home: "Startseite",
    metar: "METAR",
    vfrPlanner: "VFR-Planer",
    about: "Über",
    mainTitle: "AeroNav23 Flight Tools",
    mainDescription: "Werkzeuge für Flugsimulatoren: Umrechner, METAR und VFR-Planer.",
    converter: "Umrechner",
    conversionType: "Umrechnungstyp",
    value: "Wert",
    valuePlaceholder: "Beispiel: 1013",
    feetToMeters: "Fuß → Meter",
    metersToFeet: "Meter → Fuß",
    kgToTons: "Kilogramm → Tonnen",
    tonsToKg: "Tonnen → Kilogramm",
    hpaToInhg: "hPa → inHg",
    inhgToHpa: "inHg → hPa",
    convertBtn: "Umrechnen",
    convertResult: "Ergebnis erscheint hier",
    quickMetar: "Schnelles METAR",
    icao: "ICAO",
    icaoCode: "ICAO-Code",
    icaoPlaceholder: "OMDB",
    icaoPlaceholderLong: "Beispiel: OMDB",
    getMetar: "METAR abrufen",
    openOfficialMetar: "Offizielles METAR öffnen",
    metarResult: "METAR erscheint hier",
    metarDescription: "Geben Sie den ICAO-Code des Flughafens ein, zum Beispiel OMDB, EGLL, KLAX, URSS.",
    aboutText: "AeroNav23 Flight Tools ist ein kostenloses Toolkit für Flugsimulatoren: METAR, Umrechner und VFR-Planer.",
    simulationOnly: "⚠️ Nur für Simulatoren. Nicht für echte Luftfahrt verwenden.",
    dataSources: "Datenquellen",
    language: "Language:",
    enterNumber: "Geben Sie eine Zahl ein.",
    unknownConversion: "Unbekannter Umrechnungstyp.",
    enterIcao: "Geben Sie einen 4-stelligen ICAO-Code ein.",
    metarInsideError: "METAR auf der Website ist vorübergehend deaktiviert.",
    metarExternalHint: "Drücken Sie die Schaltfläche „Offizielles METAR öffnen“.",
    clearConfirm: "Alle Linien löschen?",
    tipDraw: "Linie: Klicken für Punkte, Doppelklick zum Beenden",
    tipEdit: "Punkte bearbeiten",
    tipDeletePoint: "Punkt löschen",
    tipMove: "Linie verschieben",
    tipDeleteLine: "Linie löschen",
    tipClear: "Alles löschen",
    tipCompass: "Kompass-Overlay"
  }
};

let currentLang = "ru";

function t(key) {
  return translations[currentLang]?.[key] || translations.ru[key] || key;
}

function changeLanguage() {
  const select = document.getElementById("languageSelect");
  currentLang = select.value;

  const dict = translations[currentLang] || translations.ru;

  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (dict[key]) el.textContent = dict[key];
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (dict[key]) el.placeholder = dict[key];
  });

  document.querySelectorAll("[data-i18n-title]").forEach(el => {
    const key = el.getAttribute("data-i18n-title");
    if (dict[key]) el.setAttribute("data-tip", dict[key]);
  });

  localStorage.setItem("aeronav23_lang", currentLang);
}

function loadSavedLanguage() {
  const saved = localStorage.getItem("aeronav23_lang") || "ru";
  const select = document.getElementById("languageSelect");

  if (select && translations[saved]) {
    select.value = saved;
    currentLang = saved;
    changeLanguage();
  }
}


