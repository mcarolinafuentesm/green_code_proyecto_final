import pandas as pd

# Cargar el CSV original
df = pd.read_csv('01 renewable-share-energy.csv')

# Filtrar solo Colombia
colombia_df = df[df['Entity'].str.lower() == 'colombia']

# Seleccionar columnas relevantes
colombia_df = colombia_df[['Year', 'Renewables (% equivalent primary energy)']]

# Exportar a JSON (orientado como lista de diccionarios)
colombia_df.to_json('colombia.json', orient='records', indent=2)
