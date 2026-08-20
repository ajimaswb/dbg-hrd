import pandas as pd
import json

df = pd.read_excel("GAJI JUNI 2026.xlsx")
# Row 0 contains headers like NIK, GP '24
headers = df.iloc[0].values
nik_idx = -1
gp_idx = -1

for i, h in enumerate(headers):
    h_str = str(h).strip().upper()
    if h_str == 'NIK':
        nik_idx = i
    elif 'GP' in h_str and '24' in h_str:
        gp_idx = i

if nik_idx == -1 or gp_idx == -1:
    print("Columns not found!")
    exit(1)

results = {}
for idx in range(1, len(df)):
    row = df.iloc[idx].values
    nik = str(row[nik_idx]).strip()
    gp = row[gp_idx]
    
    if pd.isna(nik) or nik == 'nan' or nik == '':
        continue
        
    try:
        gp_val = float(gp)
        results[nik] = gp_val
    except:
        pass

with open('public/gaji_pokok.json', 'w') as f:
    json.dump(results, f)

print(f"Exported {len(results)} salaries.")
