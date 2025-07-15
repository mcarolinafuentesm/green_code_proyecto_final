
import pandas as pd

# Cargar la base de datos (asegúrate de que el archivo esté en la misma carpeta)
df = pd.read_csv(r"C:\Users\ASUS\green_code_proyecto_final\proyecto-final\01 renewable-share-energy.csv")

def calcular_energia_renovable(pais, año, consumo_kwh):
    fila = df[(df['Entity'].str.lower() == pais.lower()) & (df['Year'] == año)]

    if fila.empty:
        return f"No se encontraron datos para {pais} en el año {año}."

    porcentaje_renovable = fila['Renewables (% equivalent primary energy)'].values[0]
    consumo_renovable = (porcentaje_renovable / 100) * consumo_kwh

    resultado = (
        f"En {pais} en el año {año}, el {porcentaje_renovable:.2f}% de la energía fue renovable.\n"
        f"Si consumiste {consumo_kwh} kWh, entonces {consumo_renovable:.2f} kWh provienen de fuentes limpias."
    )
    return resultado

# Ejemplo de uso:
if __name__ == "__main__":
    pais = input("Ingresa el nombre del país: ")
    año = int(input("Ingresa el año (entre 1965 y 2021): "))
    consumo = float(input("Ingresa tu consumo eléctrico en kWh: "))

    print(calcular_energia_renovable(pais, año, consumo))
