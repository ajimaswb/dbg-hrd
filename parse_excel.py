import pandas as pd

df = pd.read_excel('Data Staff.xlsx', sheet_name='Sheet1', header=0)
for val in df[~df['NAMA'].str.contains('ALOKASI', na=False)]['TGL MASUK'].head(30).values:
    print(val, type(val))
