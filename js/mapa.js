let tabla = document.querySelector("#tabla tbody");
let datosCSV = [];
let mapa;
let capaPaises;

// Diccionario de equivalencias: GeoJSON → CSV
const equivalencias = {
  "United States of America": "United States",
  "Czech Republic": "Czechia",
  "Russian Federation": "Russia",
  "Korea, Republic of": "South Korea",
  "Korea, Democratic People's Republic of": "North Korea",
  "Iran (Islamic Republic of)": "Iran",
  "Venezuela (Bolivarian Republic of)": "Venezuela",
  "Syrian Arab Republic": "Syria",
  "Bolivia (Plurinational State of)": "Bolivia",
  "United Republic of Tanzania": "Tanzania",
  "Democratic Republic of the Congo": "Congo (Kinshasa)",
  "Republic of the Congo": "Congo (Brazzaville)",
  "Lao People's Democratic Republic": "Laos",
  "North Macedonia": "Macedonia"
};

// Devuelve el nombre como aparece en el CSV
function normalizarNombre(geojsonName) {
  return equivalencias[geojsonName] || geojsonName;
}

function cargarCSV(callback) {
  Papa.parse("data/01_renewable-share-energy.csv", {
    download: true,
    header: true,
    complete: function (results) {
      datosCSV = results.data;
      callback();
    }
  });
}

function mostrarTabla(paisCSV) {
  if (!paisCSV) return;

  tabla.innerHTML = "";

  const datosFiltrados = datosCSV.filter(d => d.Entity === paisCSV);

  if (datosFiltrados.length === 0) return;

  document.getElementById("titulo-tabla").innerText = `Historial de ${paisCSV}`;
  document.getElementById("tabla-container").style.display = "block";

  for (let d of datosFiltrados) {
    if (d.Entity && d.Year && d["Renewables (% equivalent primary energy)"]) {
      tabla.innerHTML += `
        <tr>
          <td>${d.Entity}</td>
          <td>${d.Year}</td>
          <td>${parseFloat(d["Renewables (% equivalent primary energy)"]).toFixed(2)}%</td>
        </tr>`;
    }
  }
}

function iniciarMapa() {
  mapa = L.map("map").setView([20, 0], 2);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors"
  }).addTo(mapa);

  fetch("data/mapa.json")
    .then(res => res.json())
    .then(geojson => {
      capaPaises = L.geoJson(geojson, {
        style: feature => ({
          color: "white",
          weight: 1,
          fillColor: paisTieneDatos(feature.properties.name) ? "#00b4d8" : "#ccc",
          fillOpacity: 0.7
        }),
        onEachFeature: (feature, layer) => {
          const geoName = feature.properties.name;
          if (paisTieneDatos(geoName)) {
            const csvName = normalizarNombre(geoName);
            layer.on("click", () => mostrarTabla(csvName));
          }
        }
      }).addTo(mapa);
    });
}

function paisTieneDatos(nombreGeoJSON) {
  const nombreCSV = normalizarNombre(nombreGeoJSON);
  return datosCSV.some(d => d.Entity === nombreCSV);
}

// Iniciar
cargarCSV(() => {
  iniciarMapa();
  document.getElementById("tabla-container").style.display = "none";
});
