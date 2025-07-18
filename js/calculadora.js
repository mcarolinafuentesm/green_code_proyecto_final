document.getElementById("formularioEnergia").addEventListener("submit", function(e){
  e.preventDefault();

  let anio = parseInt(document.getElementById("anio").value);
  let consumo = parseFloat(document.getElementById("consumoTotal").value);

  // Usar fetch para obtener el JSON de Colombia
  fetch('./colombia.json')
    .then(response => response.json())
    .then(data => {
      // Buscar el año ingresado
      let registro = data.find(d => d.Year === anio);

      if (registro) {
        let porcentajeRenovable = registro["Renewables (% equivalent primary energy)"];
        let consumoRenovable = (porcentajeRenovable / 100) * consumo;

        let resultado = `
          En Colombia en ${anio}, el ${porcentajeRenovable.toFixed(2)}% de la energía fue renovable.<br>
          Si consumiste ${consumo.toFixed(2)} kWh, entonces ${consumoRenovable.toFixed(2)} kWh provienen de fuentes limpias.
        `;
        document.getElementById("resultado").innerHTML = resultado;
      } else {
        document.getElementById("resultado").innerHTML = `No hay datos para el año ${anio}.`;
      }
    })
    .catch(error => {
      console.error('Error al cargar los datos:', error);
      document.getElementById("resultado").innerHTML = "Ocurrió un error al cargar los datos.";
    });
});

