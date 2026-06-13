async function fetchMetar(icaoRaw, resultBox) {
  const icao = icaoRaw.trim().toUpperCase();

  if (icao.length !== 4) {
    resultBox.textContent = t("enterIcao");
    return;
  }

  resultBox.textContent = "Loading METAR...";

  try {
    const response = await fetch(
      `https://shrill-heart-dd01.timsolnysko2.workers.dev/?icao=${icao}`
    );

    const data = await response.json();

    if (!data || data.length === 0) {
      resultBox.textContent = "METAR not found";
      return;
    }

    const metar = data[0];

    resultBox.textContent =
`ICAO: ${metar.icaoId || icao}

RAW METAR:
${metar.rawOb || "No data"}

Temperature: ${metar.temp ?? "?"}°C
Dew point: ${metar.dewp ?? "?"}°C
Wind: ${metar.wdir ?? "?"} ${metar.wspd ?? "?"} kt
QNH: ${metar.altim ?? "?"} hPa
Category: ${metar.fltCat || "?"}`;
  } catch (err) {
    console.error(err);
    resultBox.textContent = "Ошибка получения METAR.";
  }
}
