import pandas as pd
import json
import math

file = "GAJI JUNI 2026.xlsx"
xls = pd.ExcelFile(file)
results = {}

for sheet in xls.sheet_names:
    try:
        df = pd.read_excel(file, sheet_name=sheet, header=None)
        nik_idx = -1
        name_idx = -1
        gp_idx = -1
        
        for idx, row in df.iterrows():
            if name_idx == -1 or gp_idx == -1:
                # search for headers
                for i, cell in enumerate(row):
                    val = str(cell).strip().upper()
                    if val == 'NIK':
                        nik_idx = i
                    elif val == 'NAMA':
                        name_idx = i
                    elif 'GP' in val and ('24' in val or '2024' in val):
                        gp_idx = i
            else:
                # Read data
                nik = str(row.get(nik_idx)).strip() if nik_idx != -1 else ""
                name = str(row.get(name_idx)).strip() if name_idx != -1 else ""
                gp = row.get(gp_idx)
                
                try:
                    gp_val = float(gp)
                    if math.isnan(gp_val):
                        continue
                    if str(nik).startswith('DBG'):
                        results[nik.lower()] = gp_val
                    elif name != "" and name != "nan":
                        results[name.lower()] = gp_val
                except:
                    pass
    except Exception as e:
        pass

with open('public/gaji_pokok.json', 'w') as f:
    json.dump(results, f)

print(f"Exported {len(results)} salaries without NaN.")
