// Variables globales
let grafico = null; // Instancia del gráfico de Chart.js
let datosGlobales = {}; // Almacena todos los datos cargados por país y año
const paisesDisponibles = new Set(); // Conjunto de países únicos
const ANIOS_DISPONIBLES = new Set(); // Conjunto de años únicos

const CONFIG_FUENTES = [
    {
        nombre: "Hidroeléctrica",
        archivo: "data/07_share-electricity-hydro.csv",
        columna: "Hydro (% electricity)",
        color: "#1f77b4" // Azul (más profesional)
    },
    {
        nombre: "Eólica",
        archivo: "data/11_share-electricity-wind.csv",
        columna: "Wind (% electricity)",
        color: "#ff7f0e" // Naranja (más profesional)
    },
    {
        nombre: "Solar",
        archivo: "data/15_share-electricity-solar.csv",
        columna: "Solar (% electricity)",
        color: "#2ca02c" // Verde (más profesional)
    },
    {
        nombre: "Otras Renovables",
        archivo: "data/04_share-electricity-renewables.csv", // Representa el TOTAL de renovables
        columna: "Renewables (% electricity)",
        color: "#9467bd" // Púrpura (más profesional)
    }
];

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
    await cargarDatos();
    initSelectores();
    initGrafico();
});

/**
 * Carga todos los datos de los CSV y los organiza en la estructura datosGlobales.
 */
async function cargarDatos() {
    const cargas = CONFIG_FUENTES.map(fuente =>
        cargarCSV(fuente.archivo).then(data => {
            data.forEach(row => {
                const pais = row.Entity;
                const año = parseInt(row.Year);
                const valor = parseFloat(row[fuente.columna]); // No usar || 0 aquí para diferenciar null/NaN de 0 real

                if (pais && !isNaN(año) && !isNaN(valor)) {
                    if (!datosGlobales[pais]) {
                        datosGlobales[pais] = {};
                        paisesDisponibles.add(pais);
                    }
                    if (!datosGlobales[pais][año]) {
                        datosGlobales[pais][año] = {};
                    }
                    datosGlobales[pais][año][fuente.nombre] = { valor, color: fuente.color };
                    ANIOS_DISPONIBLES.add(año); // Recopilar todos los años disponibles
                }
            });
        })
    );

    await Promise.all(cargas);
    console.log("Datos globales cargados:", datosGlobales); // Para depuración
}

/**
 * Carga un archivo CSV individual usando Papa Parse.
 * @param {string} archivo La ruta al archivo CSV.
 * @returns {Promise<Array<Object>>} Una promesa que resuelve con los datos del CSV.
 */
function cargarCSV(archivo) {
    return new Promise((resolve) => {
        Papa.parse(archivo, {
            download: true,
            header: true,
            complete: (results) => resolve(results.data),
            error: (error) => {
                console.error(`Error cargando ${archivo}:`, error);
                resolve([]); // Devolver un array vacío en caso de error
            }
        });
    });
}

/**
 * Inicializa los selectores de país y año con los datos cargados.
 */
function initSelectores() {
    const selectorPais = document.getElementById('selectorPais');
    const selectorAnio = document.getElementById('selectorAnio');

    // Llenar selector de países
    const paisesOrdenados = Array.from(paisesDisponibles).sort();
    selectorPais.innerHTML = paisesOrdenados
        .map(pais => `<option value="${pais}">${pais}</option>`)
        .join('');

    // Establecer "World" como predeterminado si existe, sino el primero
    if (paisesOrdenados.includes("World")) {
        selectorPais.value = "World";
    } else if (paisesOrdenados.length > 0) {
        selectorPais.value = paisesOrdenados[0];
    }

    // Event listeners para los selectores
    selectorPais.addEventListener('change', () => {
        actualizarSelectorAnios(selectorPais.value);
        actualizarGrafico();
    });
    selectorAnio.addEventListener('change', actualizarGrafico);

    // Inicializar años para el país seleccionado por defecto
    actualizarSelectorAnios(selectorPais.value);
}

/**
 * Actualiza las opciones del selector de años según el país seleccionado.
 * @param {string} pais El país seleccionado.
 */
function actualizarSelectorAnios(pais) {
    const selectorAnio = document.getElementById('selectorAnio');
    const aniosDelPais = Object.keys(datosGlobales[pais] || {})
        .map(Number)
        .sort((a, b) => a - b);

    selectorAnio.innerHTML = aniosDelPais
        .map(anio => `<option value="${anio}">${anio}</option>`)
        .join('');

    // Seleccionar el último año disponible por defecto
    selectorAnio.value = aniosDelPais.length > 0 ? aniosDelPais[aniosDelPais.length - 1] : '';
    selectorAnio.disabled = aniosDelPais.length === 0;
}

/**
 * Inicializa la instancia del gráfico de torta.
 */
function initGrafico() {
    const ctx = document.getElementById('graficoTortaProfesional').getContext('2d');

    grafico = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: [], // Se llenarán en actualizarGrafico
            datasets: [] // Se llenarán en actualizarGrafico
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    left: 20,
                    right: 20,
                    top: 20,
                    bottom: 20
                }
            },
            plugins: {
                legend: {
                    position: window.innerWidth > 768 ? 'right' : 'bottom', // Leyenda a la derecha en pantallas grandes
                    labels: {
                        font: {
                            size: 14,
                            family: 'Montserrat, sans-serif'
                        },
                        padding: 25, // Espacio entre elementos de la leyenda
                        usePointStyle: true, // Usa un círculo como marcador en la leyenda
                        color: '#495057'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', // Fondo blanco casi opaco
                    borderColor: '#ced4da', // Borde gris claro
                    borderWidth: 1,
                    titleColor: '#495057',
                    bodyColor: '#343a40',
                    titleFont: { size: 15, weight: 'bold', family: 'Montserrat, sans-serif' },
                    bodyFont: { size: 14, family: 'Montserrat, sans-serif' },
                    padding: 15,
                    cornerRadius: 8, // Bordes redondeados
                    displayColors: true,
                    boxPadding: 6,
                    callbacks: {
                        label: (context) => {
                            const label = context.label || '';
                            const rawValue = context.raw;
                            const totalDataset = context.dataset.data.reduce((sum, val) => sum + val, 0);
                            const percentage = totalDataset > 0 ? ((rawValue / totalDataset) * 100).toFixed(1) : 0;
                            // Muestra el valor absoluto y el porcentaje sobre el total visible en el gráfico
                            return `${label}: ${rawValue.toFixed(1)}% (${percentage}%)`;
                        }
                    }
                },
                title: {
                    display: true,
                    text: 'Distribución de Electricidad Renovable', // Título inicial, se actualizará
                    font: {
                        size: 24,
                        weight: 'bold',
                        family: 'Montserrat, sans-serif'
                    },
                    color: '#2c3e50',
                    padding: { top: 10, bottom: 30 }
                }
            }
        }
    });

    // Cargar los datos iniciales en la gráfica
    actualizarGrafico();
}

/**
 * Actualiza los datos y el título del gráfico de torta según la selección de país y año.
 */
function actualizarGrafico() {
    const pais = document.getElementById('selectorPais').value;
    const año = parseInt(document.getElementById('selectorAnio').value);

    // Si no hay país o año seleccionado, o no hay datos para esa combinación, mostrar mensaje
    if (!pais || !año || !datosGlobales[pais] || !datosGlobales[pais][año]) {
        if (grafico) {
            grafico.data.labels = [];
            grafico.data.datasets = [];
            grafico.options.plugins.title.text = `Datos no disponibles para ${pais} en ${año}`;
            grafico.update();
        }
        return;
    }

    const datosPaisAño = datosGlobales[pais][año];
    const totalRenovablesReportado = datosPaisAño["Otras Renovables"]?.valor || 0; // Este es el % total de renovables

    // Obtener los valores de las fuentes específicas
    const hidro = datosPaisAño["Hidroeléctrica"]?.valor || 0;
    const eolica = datosPaisAño["Eólica"]?.valor || 0;
    const solar = datosPaisAño["Solar"]?.valor || 0;

    // Calcular "Otras Renovables" restantes
    let otrasRenovablesCalculado = 0;
    const sumaEspecificas = hidro + eolica + solar;

    if (totalRenovablesReportado > 0) {
        if (sumaEspecificas < totalRenovablesReportado) {
            otrasRenovablesCalculado = totalRenovablesReportado - sumaEspecificas;
        } else if (sumaEspecificas > totalRenovablesReportado) {
            // Si la suma de las específicas excede el total reportado, hay una inconsistencia.
            // En este caso, para asegurar que el gráfico de torta refleje el total 'Otras Renovables'
            // no debería ser un valor residual, y ajustamos el título para indicar que el total es la suma de las partes.
            // Podríamos decidir no mostrar "Otras Renovables" como segmento si es negativo.
            otrasRenovablesCalculado = 0;
            console.warn(`Suma de específicas (${sumaEspecificas}%) excede el total de renovables reportado (${totalRenovablesReportado}%) para ${pais} en ${año}.`);
        }
    } else if (sumaEspecificas > 0) {
        // Si el total reportado es 0, pero las específicas tienen valores, asumimos el total es la suma de específicas.
        otrasRenovablesCalculado = 0; // No mostrar como un segmento separado si ya están cubiertas.
    }

    const datosParaGrafico = [
        { nombre: "Hidroeléctrica", valor: hidro, color: CONFIG_FUENTES.find(f => f.nombre === "Hidroeléctrica").color },
        { nombre: "Eólica", valor: eolica, color: CONFIG_FUENTES.find(f => f.nombre === "Eólica").color },
        { nombre: "Solar", valor: solar, color: CONFIG_FUENTES.find(f => f.nombre === "Solar").color },
        { nombre: "Otras Renovables", valor: otrasRenovablesCalculado, color: CONFIG_FUENTES.find(f => f.nombre === "Otras Renovables").color }
    ].filter(item => item.valor > 0); // Solo incluir segmentos con valor > 0

    // Si después del filtro no hay datos para mostrar, informar al usuario.
    if (datosParaGrafico.length === 0) {
        if (grafico) {
            grafico.data.labels = [];
            grafico.data.datasets = [];
            grafico.options.plugins.title.text = `No hay datos renovables para ${pais} en ${año}`;
            grafico.update();
        }
        return;
    }

    grafico.data = {
        labels: datosParaGrafico.map(item => item.nombre),
        datasets: [{
            data: datosParaGrafico.map(item => item.valor),
            backgroundColor: datosParaGrafico.map(item => item.color),
            borderColor: '#fff', // Borde blanco entre segmentos
            borderWidth: 2, // Grosor del borde
            hoverOffset: 10 // Desplazamiento al pasar el ratón
        }]
    };

    grafico.options.plugins.title.text = `Distribución de Electricidad Renovable en ${pais} (${año})`;
    grafico.update();
}

// Manejo responsive para la posición de la leyenda
window.addEventListener('resize', function () {
    if (grafico) {
        grafico.options.plugins.legend.position = window.innerWidth > 768 ? 'right' : 'bottom';
        grafico.update();
    }
});