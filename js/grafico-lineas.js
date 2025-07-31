// =========================================================================================
// LÓGICA PARA LA GRÁFICA DE LÍNEAS
// =========================================================================================

let myLineChart = null; // Variable global para la instancia de la gráfica de LÍNEAS
let allLineData = {}; // Almacenará los datos de todos los CSV por fuente para la gráfica de LÍNEAS

document.addEventListener('DOMContentLoaded', () => {
    // Si tienes múltiples gráficas, puedes llamar a sus funciones de inicialización aquí.
    // Por ejemplo:
    cargarTodosLosDatosLineasYInicializarGrafico();
    // cargarTodosLosDatosTortaYInicializarGrafico(); // Si tuvieras otra función para la torta
});

// Función principal que carga los datos, inicializa los filtros y la gráfica de LÍNEAS
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

    const promises = fuentesConfig.map(fuente => {
        return new Promise(resolve => {
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
                    console.error(`Error al cargar los datos de "${fuente.nombre}" desde "${fuente.archivo}":`, err);
                    resolve(null);
                }
            });
        });
    });

    const allFetchedData = (await Promise.all(promises)).filter(data => data !== null);

    if (!allFetchedData.length) {
        console.error("No se pudieron cargar datos válidos de ninguna fuente para la gráfica de líneas.");
        const container = document.querySelector('#graficoCapacidadInstaladaFiltros').parentNode;
        if (container) {
            container.innerHTML = '<p class="text-center text-danger fs-5 mt-3">¡Lo sentimos! No pudimos cargar los datos de la gráfica de líneas.</p>';
        }
        return;
    }

    allLineData = allFetchedData.flat();

    const years = [...new Set(allLineData.map(row => parseInt(row.Year)).filter(year => !isNaN(year)))].sort((a, b) => a - b);
    const entities = [...new Set(allLineData.map(row => row.Entity))].sort();

    const filtroAnioSelect = document.getElementById('filtroAnioLineas');
    years.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        filtroAnioSelect.appendChild(option);
    });
    if (years.length > 0) {
        filtroAnioSelect.value = years[years.length - 1];
    }

    const filtroPaisSelect = document.getElementById('filtroPaisLineas');
    if (!entities.includes("World")) {
        entities.unshift("World");
    }
    entities.forEach(entity => {
        if (entity && entity.trim() !== '') {
            const option = document.createElement('option');
            option.value = entity;
            option.textContent = entity;
            filtroPaisSelect.appendChild(option);
        }
    });
    filtroPaisSelect.value = "World";

    document.getElementById('aplicarFiltrosLineas').addEventListener('click', actualizarGraficoLineas);

    actualizarGraficoLineas();
}

// Función para actualizar la gráfica de LÍNEAS en base a los filtros
function actualizarGraficoLineas() {
    const selectedCountry = document.getElementById('filtroPaisLineas').value;
    const selectedYear = parseInt(document.getElementById('filtroAnioLineas').value);

    const datosFiltrados = allLineData.filter(row =>
        row.Entity === selectedCountry &&
        parseInt(row.Year) <= selectedYear
    );

    const datasets = [];
    const yearsForCountry = [...new Set(datosFiltrados.map(row => parseInt(row.Year)))].sort((a, b) => a - b);

    if (yearsForCountry.length === 0) {
        console.warn(`No hay datos disponibles para ${selectedCountry} hasta el año ${selectedYear} para la gráfica de líneas.`);
        if (myLineChart) {
            myLineChart.destroy();
            const chartContainer = document.getElementById('graficoCapacidadInstaladaFiltros').parentNode;
            chartContainer.innerHTML = '<p class="text-center text-info fs-5 mt-3">No hay datos disponibles para la selección actual de la gráfica de líneas.</p>';
        }
        return;
    }

    const fuentesOriginales = [
        { nombre: "Eólica", columna: "Wind Capacity", color: "rgba(31, 119, 180, 1)", unidad: "GW" },
        { nombre: "Solar", columna: "Solar Capacity", color: "rgba(255, 127, 14, 1)", unidad: "GW" },
        { nombre: "Geotérmica", columna: "Geothermal Capacity (TWh)", color: "rgba(44, 160, 44, 1)", unidad: "TWh" }
    ];

    fuentesOriginales.forEach(fuente => {
        const valoresFuente = yearsForCountry.map(year => {
            const row = datosFiltrados.find(d => parseInt(d.Year) === year && d.sourceName === fuente.nombre);
            return (row && !isNaN(parseFloat(row[fuente.columna]))) ? parseFloat(row[fuente.columna]) : 0;
        });

        if (valoresFuente.some(v => v > 0)) {
            datasets.push({
                label: `${fuente.nombre}`,
                data: valoresFuente,
                borderColor: fuente.color,
                backgroundColor: fuente.color.replace('1)', '0.1)'),
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 7,
                pointBackgroundColor: fuente.color,
                pointBorderColor: 'rgba(255, 255, 255, 0.9)',
                pointBorderWidth: 2,
                fill: false,
                borderWidth: 3,
                hoverBorderWidth: 4,
                hoverBorderColor: fuente.color,
                sourceUnit: fuente.unidad
            });
        }
    });

    if (datasets.length === 0) {
        if (myLineChart) {
            myLineChart.destroy();
        }
        const chartContainer = document.getElementById('graficoCapacidadInstaladaFiltros').parentNode;
        chartContainer.innerHTML = '<p class="text-center text-info fs-5 mt-3">No hay datos de capacidad para las fuentes seleccionadas en este país/año para la gráfica de líneas.</p>';
        return;
    }

    const uniqueUnits = [...new Set(fuentesOriginales.map(f => f.unidad))];
    const yAxisTitleText = `Capacidad Instalada (${uniqueUnits.join(' / ')})`;

    if (myLineChart) {
        myLineChart.destroy();
    }

    const ctx = document.getElementById("graficoCapacidadInstaladaFiltros").getContext("2d");
    myLineChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: yearsForCountry,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                title: {
                    display: true,
                    text: `Capacidad Instalada de Energía Renovable en ${selectedCountry} (Hasta ${selectedYear})`,
                    font: {
                        size: 26,
                        weight: 'bold',
                        family: 'Montserrat, sans-serif'
                    },
                    padding: { top: 25, bottom: 40 },
                    color: '#2c3e50'
                },
                tooltip: {
                    callbacks: {
                        title: function(context) {
                            return `Año: ${context[0].label}`;
                        },
                        label: function(context) {
                            const datasetLabel = context.dataset.label || '';
                            const value = context.raw;
                            const unit = context.dataset.sourceUnit || '';
                            return `${datasetLabel}: ${value.toLocaleString('es-ES', { maximumFractionDigits: 2 })} ${unit}`;
                        }
                    },
                    backgroundColor: 'rgba(255, 255, 255, 0.98)',
                    borderColor: '#ced4da',
                    borderWidth: 1,
                    titleColor: '#495057',
                    bodyColor: '#343a40',
                    titleFont: { size: 15, weight: 'bold', family: 'Montserrat, sans-serif' },
                    bodyFont: { size: 14, family: 'Montserrat, sans-serif' },
                    padding: 15,
                    cornerRadius: 8,
                    displayColors: true,
                    boxPadding: 6,
                    caretSize: 8
                },
                legend: {
                    position: 'bottom',
                    labels: {
                        font: {
                            size: 14,
                            family: 'Montserrat, sans-serif'
                        },
                        usePointStyle: true,
                        padding: 25,
                        color: '#495057'
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Año',
                        font: { weight: 'bold', size: 16, family: 'Montserrat, sans-serif' },
                        padding: { top: 20 },
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
                        text: yAxisTitleText,
                        font: { weight: 'bold', size: 16, family: 'Montserrat, sans-serif' },
                        padding: { bottom: 20 },
                        color: '#555'
                    },
                    ticks: {
                        font: { size: 13, family: 'Montserrat, sans-serif' },
                        color: '#777',
                        callback: function(value) {
                            return value.toLocaleString('es-ES');
                        }
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