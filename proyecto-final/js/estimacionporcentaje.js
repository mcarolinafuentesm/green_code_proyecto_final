
  // Simulación de capacidades instaladas (kWh generados por fuente renovable)
  const datosRenovables = {
    solar: 2000,
    eolica: 3000,
    hidro: 1500,
    geotermica: 500
  };

  document.getElementById("formularioEnergia").addEventListener("submit", function(e) {
    e.preventDefault();

    const consumo = parseFloat(document.getElementById("consumoTotal").value);

    // Sumar total de energía renovable
    const energiaRenovable = Object.values(datosRenovables).reduce((a, b) => a + b, 0);

    // Suponiendo que esa es la energía total producida por la comunidad
    const produccionTotal = energiaRenovable + 4000; // 4000 no renovable (simulado)

    const proporcionRenovable = energiaRenovable / produccionTotal;

    // Estimar cuánto del consumo del usuario es renovable
    const consumoRenovable = consumo * proporcionRenovable;
    const porcentaje = (consumoRenovable / consumo) * 100;

    document.getElementById("resultado").innerHTML = `
      <h4>Resultado</h4>
      <p>De un consumo total de <strong>${consumo} kWh</strong>, aproximadamente 
      <strong>${consumoRenovable.toFixed(2)} kWh</strong> provienen de fuentes renovables.</p>
      <p><strong>${porcentaje.toFixed(2)}%</strong> de tu consumo es energía renovable.</p>
    `;
  });

