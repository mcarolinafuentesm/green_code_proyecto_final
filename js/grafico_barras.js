document.addEventListener('DOMContentLoaded', function() {
  cargarGraficoEnergiasRenovables();
});

function cargarGraficoEnergiasRenovables() {
  // Configuración de fuentes de energía (ajustado a tus archivos y columnas)
  const fuentesEnergia = [
    { 
      nombre: "Hidroeléctrica", 
      archivo: "data/05_hydropower-consumption.csv", 
      columna: "Electricity from hydro (TWh)",
      color: "#4CAF50",
      unidad: "TWh"
    },
    { 
      nombre: "Eólica", 
      archivo: "data/08_wind-generation.csv", 
      columna: "Electricity from wind (TWh)",
      color: "#2196F3",
      unidad: "TWh"
    },
    { 
      nombre: "Solar", 
      archivo: "data/12_solar-energy-consumption.csv", 
      columna: "Electricity from solar (TWh)",
      color: "#FFC107",
      unidad: "TWh"
    },
    { 
      nombre: "Biocombustibles", 
      archivo: "data/16_biofuel-production.csv", 
      columna: "Biofuels Production - TWh - Total",
      color: "#795548",
      unidad: "TWh"
    },
    { 
      nombre: "Geotérmica", 
      archivo: "data/17_installed-geothermal-capacity.csv", 
      columna: "Geothermal Capacity (TWh)",
      color: "#F44336",
      unidad: "TWh"
    }
  ];

  // Cargar datos de cada fuente
  Promise.all(
    fuentesEnergia.map(fuente => {
      return new Promise((resolve) => {
        Papa.parse(fuente.archivo, {
          download: true,
          header: true,
          complete: function(results) {
            const datosColombia = results.data.filter(row => row.Entity === "Colombia");
            // Verificar que haya datos y que la columna exista
            if (datosColombia.length > 0 && fuente.columna in datosColombia[0]) {
              resolve({
                nombre: fuente.nombre,
                anios: datosColombia.map(row => row.Year),
                valores: datosColombia.map(row => parseFloat(row[fuente.columna]) || 0),
                color: fuente.color,
                unidad: fuente.unidad
              });
            } else {
              console.warn(`Datos no encontrados para ${fuente.nombre} en Colombia o columna "${fuente.columna}" no existe`);
              resolve(null); // Retornar null para filtrar después
            }
          },
          error: function(error) {
            console.error(`Error al cargar ${fuente.archivo}:`, error);
            resolve(null);
          }
        });
      });
    })
  ).then(datosFuentes => {
    // Filtrar fuentes con datos válidos (eliminar nulls)
    const datosValidos = datosFuentes.filter(fuente => fuente !== null);
    
    if (datosValidos.length === 0) {
      console.error("No se encontraron datos válidos para ninguna fuente");
      return;
    }

    // Crear gráfico
    const ctx = document.getElementById('graficoEnergias').getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: datosValidos[0].anios, // Años de la primera fuente válida
        datasets: datosValidos.map(fuente => ({
          label: `${fuente.nombre} (${fuente.unidad})`,
          data: fuente.valores,
          backgroundColor: fuente.color,
          borderColor: fuente.color + "80", // Añade transparencia al borde
          borderWidth: 1
        }))
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
            labels: { 
              font: { size: 12 },
              usePointStyle: true // Iconos circulares en la leyenda
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                return `${context.dataset.label}: ${context.raw.toFixed(2)}`;
              }
            }
          },
          title: {
            display: true,
            text: 'Producción de Energía Renovable en Colombia (TWh)',
            font: { size: 16, weight: 'bold' }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: { 
              display: true, 
              text: 'Teravatios-hora (TWh)',
              font: { weight: 'bold' }
            }
          },
          x: {
            title: { 
              display: true, 
              text: 'Año',
              font: { weight: 'bold' }
            }
          }
        }
      }
    });
  });
}