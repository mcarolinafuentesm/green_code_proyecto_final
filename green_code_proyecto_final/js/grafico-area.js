let allChartData = []; // Variable global para almacenar todos los datos
        let myChart; // Variable para la instancia del gráfico

        Papa.parse("data/02_modern-renewable-energy-consumption.csv", {
            download: true,
            header: true,
            complete: function(results) {
                // Filtra los datos que son válidos (ej. tienen un 'Entity' y 'Year')
                allChartData = results.data.filter(row => row.Entity && row.Year);

                // Obtener países únicos y años
                const uniqueCountries = [...new Set(allChartData.map(row => row.Entity))].sort();
                const uniqueYears = [...new Set(allChartData.map(row => row.Year))].sort((a, b) => a - b); // Ordenar años numéricamente

                // Rellenar select de países
                const countrySelect = document.getElementById("chartFiltroPais");
                uniqueCountries.forEach(country => {
                    const option = document.createElement("option");
                    option.value = country;
                    option.textContent = country;
                    countrySelect.appendChild(option);
                });

                // Seleccionar "World" por defecto si existe
                if (uniqueCountries.includes("World")) {
                    countrySelect.value = "World";
                }

                // Rellenar select de años "Desde" y "Hasta"
                const yearDesdeSelect = document.getElementById("chartFiltroAnoDesde");
                const yearHastaSelect = document.getElementById("chartFiltroAnoHasta");

                uniqueYears.forEach(year => {
                    const optionDesde = document.createElement("option");
                    optionDesde.value = year;
                    optionDesde.textContent = year;
                    yearDesdeSelect.appendChild(optionDesde);

                    const optionHasta = document.createElement("option");
                    optionHasta.value = year;
                    optionHasta.textContent = year;
                    yearHastaSelect.appendChild(optionHasta);
                });

                // Seleccionar un rango de años por defecto (ej. los últimos 10 años o todos si no hay tantos)
                if (uniqueYears.length > 0) {
                    yearDesdeSelect.value = uniqueYears[0]; // Desde el primer año
                    yearHastaSelect.value = uniqueYears[uniqueYears.length - 1]; // Hasta el último año
                }


                // Renderizar el gráfico inicial
                renderChart();

                // Añadir listeners para los cambios en los filtros
                countrySelect.addEventListener("change", renderChart);
                yearDesdeSelect.addEventListener("change", renderChart);
                yearHastaSelect.addEventListener("change", renderChart);
            }
        });

        function renderChart() {
            const selectedCountry = document.getElementById("chartFiltroPais").value;
            const selectedYearDesde = parseInt(document.getElementById("chartFiltroAnoDesde").value);
            const selectedYearHasta = parseInt(document.getElementById("chartFiltroAnoHasta").value);

            // Filtra los datos para el país seleccionado y el rango de años
            const filteredData = allChartData.filter(row =>
                row.Entity === selectedCountry &&
                parseInt(row.Year) >= selectedYearDesde &&
                parseInt(row.Year) <= selectedYearHasta
            ).sort((a, b) => parseInt(a.Year) - parseInt(b.Year)); // Asegurarse de que los datos estén ordenados por año

            const years = filteredData.map(row => row.Year);
            const solar = filteredData.map(row => parseFloat(row["Solar Generation - TWh"] || 0));
            const wind = filteredData.map(row => parseFloat(row["Wind Generation - TWh"] || 0));
            const hydro = filteredData.map(row => parseFloat(row["Hydro Generation - TWh"] || 0));
            const geo = filteredData.map(row => parseFloat(row["Geo Biomass Other - TWh"] || 0));

            const ctx = document.getElementById("graficoArea").getContext("2d");

            // Función para crear un degradado (para reutilizar)
            const createGradient = (context, color) => {
                const chart = context.chart;
                const { ctx, chartArea } = chart;
                if (!chartArea) return color; // Fallback si chartArea no está disponible
                const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                gradient.addColorStop(0, color.replace('0.6', '0.1')); // Versión más transparente
                gradient.addColorStop(1, color); // Versión más opaca
                return gradient;
            };

            // Destruir el gráfico existente si lo hay para recrearlo con el nuevo tipo/configuración
            if (myChart) {
                myChart.destroy();
            }

            myChart = new Chart(ctx, {
                type: 'line', // Mantener tipo 'line' para área apilada
                data: {
                    labels: years,
                    datasets: [
                        {
                            label: 'Solar',
                            data: solar,
                            backgroundColor: (context) => createGradient(context, 'rgba(255, 193, 7, 0.6)'),
                            borderColor: 'rgba(255, 193, 7, 1)',
                            fill: 'origin', // Usa 'origin' para apilar desde la base
                            tension: 0.4,
                            pointRadius: 0,
                            hoverRadius: 7,
                            pointBackgroundColor: 'rgba(255, 193, 7, 1)',
                            pointBorderColor: '#fff',
                            pointBorderWidth: 2,
                            order: 4
                        },
                        {
                            label: 'Eólica',
                            data: wind,
                            backgroundColor: (context) => createGradient(context, 'rgba(32, 201, 151, 0.6)'),
                            borderColor: 'rgba(32, 201, 151, 1)',
                            fill: 'stack', // Usa 'stack' para apilar sobre la anterior
                            tension: 0.4,
                            pointRadius: 0,
                            hoverRadius: 7,
                            pointBackgroundColor: 'rgba(32, 201, 151, 1)',
                            pointBorderColor: '#fff',
                            pointBorderWidth: 2,
                            order: 3
                        },
                        {
                            label: 'Hidroeléctrica',
                            data: hydro,
                            backgroundColor: (context) => createGradient(context, 'rgba(13, 110, 253, 0.6)'),
                            borderColor: 'rgba(13, 110, 253, 1)',
                            fill: 'stack',
                            tension: 0.4,
                            pointRadius: 0,
                            hoverRadius: 7,
                            pointBackgroundColor: 'rgba(13, 110, 253, 1)',
                            pointBorderColor: '#fff',
                            pointBorderWidth: 2,
                            order: 2
                        },
                        {
                            label: 'Geotérmica & Biomasa',
                            data: geo,
                            backgroundColor: (context) => createGradient(context, 'rgba(108, 117, 125, 0.6)'),
                            borderColor: 'rgba(108, 117, 125, 1)',
                            fill: 'stack',
                            tension: 0.4,
                            pointRadius: 0,
                            hoverRadius: 7,
                            pointBackgroundColor: 'rgba(108, 117, 125, 1)',
                            pointBorderColor: '#fff',
                            pointBorderWidth: 2,
                            order: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false, // ¡Crucial para controlar el tamaño!
                    plugins: {
                        title: {
                            display: true, // Volvemos a mostrar el título de Chart.js para que se actualice dinámicamente
                            text: `Generación de Energía Renovable en ${selectedCountry} (${selectedYearDesde}-${selectedYearHasta})`,
                            font: {
                                size: 18,
                                weight: 'bold'
                            },
                            padding: {
                                top: 10,
                                bottom: 20
                            }
                        },
                        legend: {
                            display: true,
                            position: 'bottom',
                            labels: {
                                font: {
                                    size: 13,
                                    family: 'Arial, sans-serif'
                                },
                                boxWidth: 20,
                                padding: 20,
                                usePointStyle: true,
                            }
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            backgroundColor: 'rgba(0, 0, 0, 0.85)',
                            titleFont: {
                                size: 15,
                                weight: 'bold'
                            },
                            bodyFont: {
                                size: 13
                            },
                            padding: 12,
                            caretPadding: 10,
                            displayColors: true,
                            callbacks: {
                                label: function(context) {
                                    let label = context.dataset.label || '';
                                    if (label) {
                                        label += ': ';
                                    }
                                    if (context.parsed.y !== null) {
                                        label += context.parsed.y.toLocaleString('es-CO', { maximumFractionDigits: 0 }) + ' TWh';
                                    }
                                    return label;
                                },
                                title: function(context) {
                                    return `Año: ${context[0].label}`;
                                }
                            }
                        }
                    },
                    interaction: {
                        mode: 'index',
                        intersect: false
                    },
                    stacked: true, /* Esencial para el gráfico de área apilado */
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Generación (TWh)',
                                font: {
                                    size: 15,
                                    weight: 'bold',
                                    family: 'Arial, sans-serif'
                                },
                                padding: { top: 10, bottom: 0 }
                            },
                            ticks: {
                                callback: function(value) {
                                    return value.toLocaleString('es-CO');
                                },
                                font: {
                                    size: 12
                                },
                                color: '#555'
                            },
                            grid: {
                                color: 'rgba(0, 0, 0, 0.08)',
                                drawBorder: false,
                                lineWidth: 1
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Año',
                                font: {
                                    size: 15,
                                    weight: 'bold',
                                    family: 'Arial, sans-serif'
                                },
                                padding: { top: 10, bottom: 0 }
                            },
                            ticks: {
                                font: {
                                    size: 12
                                },
                                color: '#555'
                            },
                            grid: {
                                display: false
                            }
                        }
                    }
                }
            });
        }