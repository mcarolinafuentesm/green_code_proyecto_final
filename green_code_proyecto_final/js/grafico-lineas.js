let myLineChart = null;
let allLineData = {};

document.addEventListener('DOMContentLoaded', () => {
  cargarTodosLosDatosLineasYInicializarGrafico();
});

async function cargarTodosLosDatosLineasYInicializarGrafico() {
  const fuentesConfig = [
    {
      nombre: "Eólica",
      archivo: "data/09_cumulative-installed-wind-energy-capacity-gigawatts.csv",
      columna: "Wind Capacity",
      color: "rgba(31, 119, 180, 1)",
      unidad: "GW"
    },
    {
      nombre: "Solar",
      archivo: "data/13_installed-solar-PV-capacity.csv",
      columna: "Solar Capacity",
      color: "rgba(255, 127, 14, 1)",
      unidad: "GW"
    },
    {
      nombre: "Geotérmica",
      archivo: "data/17_installed-geothermal-capacity.csv",
      columna: "Geothermal Capacity (TWh)",
      color: "rgba(44, 160, 44, 1)",
      unidad: "TWh"
    }
  ];

  const promises = fuentesConfig.map(fuente => new Promise(resolve => {
    Papa.parse(fuente.archivo, {
      download: true,
      header: true,
      complete: results => {
        const mappedData = results.data.map(row => ({
          ...row,
          sourceName: fuente.nombre,
          sourceColumn: fuente.columna,
          sourceColor: fuente.color,
          sourceUnit: fuente.unidad
        }));
        resolve(mappedData);
      },
      error: err => {
        console.error(`Error al cargar ${fuente.nombre}:`, err);
        resolve(null);
      }
    });
  }));

  const allFetchedData = (await Promise.all(promises)).filter(d => d !== null);
  allLineData = allFetchedData.flat();

  const years = [...new Set(allLineData.map(row => parseInt(row.Year)).filter(y => !isNaN(y)))].sort((a, b) => a - b);
  const entities = [...new Set(allLineData.map(row => row.Entity))].sort();

  const filtroAnioSelect = document.getElementById('filtroAnioLineas');
  years.forEach(year => {
    const option = document.createElement('option');
    option.value = year;
    option.textContent = year;
    filtroAnioSelect.appendChild(option);
  });
  filtroAnioSelect.value = years.at(-1);

  const filtroPaisSelect = document.getElementById('filtroPaisLineas');
  if (!entities.includes("World")) entities.unshift("World");
  entities.forEach(entity => {
    const option = document.createElement('option');
    option.value = entity;
    option.textContent = entity;
    filtroPaisSelect.appendChild(option);
  });
  filtroPaisSelect.value = "World";

  document.getElementById('aplicarFiltrosLineas').addEventListener('click', actualizarGraficoLineas);
  actualizarGraficoLineas();
}

function actualizarGraficoLineas() {
  const selectedCountry = document.getElementById('filtroPaisLineas').value;
  const selectedYear = parseInt(document.getElementById('filtroAnioLineas').value);

  const datosFiltrados = allLineData.filter(row =>
    row.Entity === selectedCountry && parseInt(row.Year) <= selectedYear
  );

  const yearsForCountry = [...new Set(datosFiltrados.map(row => parseInt(row.Year)))].sort((a, b) => a - b);
  if (yearsForCountry.length === 0) {
    if (myLineChart) myLineChart.destroy();
    const container = document.getElementById('graficoCapacidadInstaladaFiltros').parentNode;
    container.innerHTML = '<p class="text-center text-info fs-5 mt-3">No hay datos disponibles para esta selección.</p>';
    return;
  }

  const fuentes = [
    { nombre: "Eólica", columna: "Wind Capacity", color: "rgba(31, 119, 180, 1)", unidad: "GW" },
    { nombre: "Solar", columna: "Solar Capacity", color: "rgba(255, 127, 14, 1)", unidad: "GW" },
    { nombre: "Geotérmica", columna: "Geothermal Capacity (TWh)", color: "rgba(44, 160, 44, 1)", unidad: "TWh" }
  ];

  const datasets = fuentes.map(fuente => {
    const data = yearsForCountry.map(year => {
      const row = datosFiltrados.find(r => parseInt(r.Year) === year && r.sourceName === fuente.nombre);
      return row && !isNaN(parseFloat(row[fuente.columna])) ? parseFloat(row[fuente.columna]) : 0;
    });

    return {
      label: fuente.nombre,
      data,
      borderColor: fuente.color,
      backgroundColor: fuente.color.replace('1)', '0.1)'),
      tension: 0.4,
      fill: false,
      pointRadius: 0,
      pointHoverRadius: 7,
      pointBackgroundColor: fuente.color,
      pointBorderColor: 'rgba(255,255,255,0.9)',
      borderWidth: 3,
      sourceUnit: fuente.unidad
    };
  }).filter(d => d.data.some(v => v > 0));

  if (!datasets.length) {
    if (myLineChart) myLineChart.destroy();
    const container = document.getElementById('graficoCapacidadInstaladaFiltros').parentNode;
    container.innerHTML = '<p class="text-center text-info fs-5 mt-3">No hay datos de capacidad instalados para esta fuente.</p>';
    return;
  }

  const ctx = document.getElementById("graficoCapacidadInstaladaFiltros").getContext("2d");
  if (myLineChart) myLineChart.destroy();

  myLineChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: yearsForCountry,
      datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: { top: 20, bottom: 30, left: 25, right: 25 }
      },
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        title: {
          display: true,
          text: `Capacidad Instalada de Energía Renovable en ${selectedCountry} (Hasta ${selectedYear})`,
          font: { size: 24, weight: 'bold', family: 'Montserrat, sans-serif' },
          color: '#2c3e50',
          padding: { top: 20, bottom: 30 }
        },
        legend: {
          position: 'bottom',
          labels: {
            font: { size: 14, family: 'Montserrat, sans-serif' },
            usePointStyle: true,
            padding: 20,
            color: '#495057'
          }
        },
        tooltip: {
          callbacks: {
            title: ctx => `Año: ${ctx[0].label}`,
            label: ctx => `${ctx.dataset.label}: ${ctx.raw.toLocaleString('es-ES', { maximumFractionDigits: 2 })} ${ctx.dataset.sourceUnit}`
          },
          backgroundColor: '#fff',
          borderColor: '#ccc',
          borderWidth: 1,
          titleColor: '#495057',
          bodyColor: '#343a40',
          padding: 12,
          cornerRadius: 6,
          displayColors: true,
          boxPadding: 6,
          caretSize: 6
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Año',
            font: { size: 16, weight: 'bold', family: 'Montserrat, sans-serif' },
            color: '#555'
          },
          ticks: {
            font: { size: 13, family: 'Montserrat, sans-serif' },
            color: '#777'
          },
          grid: {
            display: false,
            drawBorder: false
          }
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: `Capacidad Instalada (${[...new Set(fuentes.map(f => f.unidad))].join(' / ')})`,
            font: { size: 16, weight: 'bold', family: 'Montserrat, sans-serif' },
            color: '#555'
          },
          ticks: {
            font: { size: 12, family: 'Montserrat, sans-serif' },
            color: '#777',
            padding: 8,
            callback: value => value.toLocaleString('es-ES')
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.08)',
            drawBorder: false
          }
        }
      }
    }
  });
}
