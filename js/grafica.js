let datosPorPais = {};
let chart;

fetch('data/01_renewable-share-energy.csv')
  .then(res => res.text())
  .then(csv => {
    const lines = csv.split('\n').filter(l => l.trim() !== '');
    const headers = lines[0].split(',');

    const entityIdx = headers.indexOf('Entity');
    const yearIdx = headers.indexOf('Year');
    const percentIdx = headers.findIndex(h => h.includes('Renewables'));

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(',');
      const pais = row[entityIdx]?.replace(/"/g, '').trim();
      const year = row[yearIdx]?.trim();
      const value = parseFloat(row[percentIdx]);

      if (!pais || !year || isNaN(value)) continue;

      if (!datosPorPais[pais]) datosPorPais[pais] = {};
      datosPorPais[pais][year] = value;
    }

    cargarMenuPaises();
    actualizarGrafica();
  });

function cargarMenuPaises() {
  const menu = document.getElementById("menu-paises");
  const paises = Object.keys(datosPorPais).sort();

  paises.forEach(pais => {
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = pais;
    checkbox.name = "pais";
    checkbox.addEventListener("change", actualizarGrafica); // Actualiza al marcar/desmarcar

    const label = document.createElement("label");
    label.style.display = "flex";
    label.style.alignItems = "center";
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(" " + pais));

    menu.appendChild(label);
  });

  // Escucha cambios en el promedio global
  document.getElementById("promedio-global").addEventListener("change", actualizarGrafica);
}

function actualizarGrafica() {
  const seleccionados = [...document.querySelectorAll('input[name="pais"]:checked')].map(c => c.value);
  const mostrarPromedio = document.getElementById('promedio-global').checked;

  const datasets = [];
  const allYears = new Set();

  // Agrega países seleccionados
  seleccionados.forEach(pais => {
    const data = datosPorPais[pais];
    const years = Object.keys(data).sort();
    const values = years.map(y => data[y]);
    years.forEach(y => allYears.add(y));

    datasets.push({
      label: pais,
      data: values,
      borderColor: colorAleatorio(),
      fill: false,
      tension: 0.3
    });
  });

  // Agrega promedio global
  if (mostrarPromedio) {
    const acumulador = {};
    const contador = {};

    for (const pais in datosPorPais) {
      for (const year in datosPorPais[pais]) {
        const val = datosPorPais[pais][year];
        if (!acumulador[year]) {
          acumulador[year] = 0;
          contador[year] = 0;
        }
        acumulador[year] += val;
        contador[year] += 1;
      }
    }

    const years = Object.keys(acumulador).sort();
    const avg = years.map(y => acumulador[y] / contador[y]);
    years.forEach(y => allYears.add(y));

    datasets.push({
      label: "Promedio Global",
      data: avg,
      borderColor: "black",
      borderWidth: 3,
      fill: false,
      tension: 0.3
    });
  }

  const labels = Array.from(allYears).sort();

  if (chart) chart.destroy();

  const ctx = document.getElementById("grafica-renovable").getContext("2d");
  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: "Comparación de Energía Renovable",
          font: {
            size: 18,
            weight: "bold"
          }
        },
        legend: {
          onClick: null // ⚠️ Desactiva la opción de ocultar líneas al hacer clic
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "Año"
          }
        },
        y: {
          title: {
            display: true,
            text: "Porcentaje (%)"
          },
          beginAtZero: true
        }
      }
    }
  });
}

function colorAleatorio() {
  return `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`;
}
