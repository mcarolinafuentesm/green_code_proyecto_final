let barChart;

// === CARGAR PAISES AL DATALIST ===
fetch('data/01_renewable-share-energy.csv')
  .then(response => response.text())
  .then(csvText => {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',');

    const entityIdx = headers.indexOf('Entity');
    const paisesUnicos = new Set();

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(',');
      const pais = row[entityIdx]?.trim();
      if (pais) paisesUnicos.add(pais);
    }

    // Ordenar alfabéticamente y agregar al datalist
    const listaPaises = document.getElementById('listaPaises');
    Array.from(paisesUnicos).sort().forEach(pais => {
      const option = document.createElement('option');
      option.value = pais;
      listaPaises.appendChild(option);
    });
  })
  .catch(error => console.error("Error cargando países:", error));

// === EVENTO SUBMIT DEL FORMULARIO ===
document.getElementById('formularioEnergia').addEventListener('submit', function (event) {
  event.preventDefault();

  const pais = document.getElementById('pais').value.trim();
  const anio = parseInt(document.getElementById('anio').value);
  const consumoKwh = parseFloat(document.getElementById('consumoTotal').value);

  fetch('data/01_renewable-share-energy.csv')
    .then(response => response.text())
    .then(csvText => {
      const lines = csvText.split('\n');
      const headers = lines[0].split(',');

      const entityIdx = headers.indexOf('Entity');
      const yearIdx = headers.indexOf('Year');
      const percentIdx = headers.findIndex(h => h.includes('Renewables'));

      const datos = [];

      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(',');
        const entidad = row[entityIdx]?.trim().toLowerCase();
        const añoDato = parseInt(row[yearIdx]);
        const porcentajeDato = parseFloat(row[percentIdx]);

        if (row.length >= 3 && !isNaN(añoDato) && !isNaN(porcentajeDato)) {
          datos.push({
            pais: row[entityIdx].trim(),
            year: añoDato,
            porcentaje: porcentajeDato
          });
        }
      }

      const dataPais = datos.filter(d => d.pais.toLowerCase() === pais.toLowerCase());
      const dataAnio = dataPais.find(d => d.year === anio);

      const resultadoDiv = document.getElementById('resultado');
      const graficasDiv = document.getElementById('contenedorGraficas');
      const tituloBarras = document.getElementById('tituloBarras');

      if (!dataAnio) {
        resultadoDiv.innerHTML = `<div class="alert alert-danger">No se encontraron datos para <strong>${pais}</strong> en el año <strong>${anio}</strong>.</div>`;
        graficasDiv.classList.remove("show");
        graficasDiv.style.display = "none";
        return;
      }

      const porcentaje = dataAnio.porcentaje;
      const consumoRenovable = (porcentaje / 100) * consumoKwh;

      resultadoDiv.innerHTML = `
        <div class="alert alert-success fade-container show">
          En <strong>${pais}</strong> en el año <strong>${anio}</strong>, el <strong>${porcentaje.toFixed(2)}%</strong> de la energía fue renovable.<br>
          Si consumiste <strong>${consumoKwh.toFixed(2)} kWh</strong>, entonces <strong>${consumoRenovable.toFixed(2)} kWh</strong> provinieron de fuentes limpias.
        </div>
      `;

      graficasDiv.style.display = "block";
      setTimeout(() => graficasDiv.classList.add("show"), 50);

      tituloBarras.textContent = `📊 Evolución de Energía Renovable en ${pais}`;

      const years = dataPais.map(d => d.year);
      const percentages = dataPais.map(d => d.porcentaje);

      if (barChart) barChart.destroy();

      const barCtx = document.getElementById('renewablesBarChart').getContext('2d');
      barChart = new Chart(barCtx, {
        type: 'bar',
        data: {
          labels: years,
          datasets: [{
            label: "% energía renovable",
            data: percentages,
            backgroundColor: "rgba(76,175,80,0.7)",
            borderColor: "#4caf50",
            borderWidth: 1,
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              title: { display: true, text: "%" },
              ticks: { callback: value => value + "%" }
            },
            x: {
              title: { display: true, text: "Año" },
              ticks: { autoSkip: true, maxTicksLimit: 6 }
            }
          }
        }
      });
    })
    .catch(error => {
      document.getElementById('resultado').innerHTML =
        `<div class="alert alert-danger">Error: ${error.message}</div>`;
      document.getElementById('contenedorGraficas').style.display = "none";
    });
});

// === ANIMACIONES FADE ===
const fadeElements = [
  document.getElementById('tituloBarras'),
  document.getElementById('contenedorGraficas')
];

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    } else {
      entry.target.classList.remove('visible');
    }
  });
}, { threshold: 0.2 });

fadeElements.forEach(el => observer.observe(el));
