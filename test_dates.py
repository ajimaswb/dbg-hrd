import pandas as pd

df = pd.read_excel('Data Staff.xlsx', sheet_name='Sheet1', header=0)
print(df[~df['NAMA'].str.contains('ALOKASI', na=False)][['NAMA', 'TGL MASUK']].head(20))
