import pandas as pd
import json
import math
import datetime

file = "Data Non Staff.xlsx"
df = pd.read_excel(file, header=0)

employees = []
for index, row in df.iterrows():
    if pd.isna(row['NAMA']):
        continue
    
    # Handle dates
    joinDate = ""
    if pd.notna(row['TGL MASUK']):
        if isinstance(row['TGL MASUK'], datetime.datetime):
            joinDate = row['TGL MASUK'].strftime('%Y-%m-%d')
        else:
            try:
                joinDate = pd.to_datetime(row['TGL MASUK']).strftime('%Y-%m-%d')
            except:
                pass
                
    emp = {
        "nik": str(row['NIK']) if pd.notna(row['NIK']) else "",
        "name": str(row['NAMA']) if pd.notna(row['NAMA']) else "",
        "department": str(row['Departemen']) if pd.notna(row['Departemen']) else "Sewing",
        "position": str(row['Posisi']) if pd.notna(row['Posisi']) else "Operator",
        "line": str(int(row['Line'])) if pd.notna(row['Line']) and type(row['Line']) in [float, int] else str(row['Line']).replace('.0', '') if pd.notna(row['Line']) and str(row['Line']).strip() != '' else "",
        "joinDate": joinDate,
        "bankName": "BCA", # Default
        "bankAccount": str(int(row['NO. REKENING'])) if pd.notna(row['NO. REKENING']) and type(row['NO. REKENING']) in [float, int] else str(row['NO. REKENING']) if pd.notna(row['NO. REKENING']) else "",
        "status": "aktif",
        "role": "employee",
        "components": {
            "gaji_pokok": int(row["GP '24"]) if pd.notna(row["GP '24"]) else 0,
            "tunjangan_jabatan": int(row['TUNJ.']) if pd.notna(row['TUNJ.']) else 0,
            "tunjangan_absen": int(row['T. ABSEN']) if pd.notna(row['T. ABSEN']) else 0,
            "potongan_bpjs_tk": int(row['BPJS TK']) if pd.notna(row['BPJS TK']) else 0,
            "potongan_bpjs_kes": int(row['BPJS KES']) if pd.notna(row['BPJS KES']) else 0,
            "potongan_forum": int(row['FORUM']) if pd.notna(row['FORUM']) else 0,
            "potongan_ganti_rugi": int(row['GANTI RUGI']) if pd.notna(row['GANTI RUGI']) else 0,
            "potongan_pokok_koperasi": int(row['POK. KOP.']) if pd.notna(row['POK. KOP.']) else 0,
            "potongan_koperasi_wajib": int(row['WJB. KOP.']) if pd.notna(row['WJB. KOP.']) else 0,
            "potongan_angsuran_koperasi": int(row['ANGS. KOP']) if pd.notna(row['ANGS. KOP']) else 0
        }
    }
    if emp["nik"] == "nan": emp["nik"] = ""
    if emp["bankAccount"] == "nan": emp["bankAccount"] = ""
    
    employees.append(emp)

with open('public/nonstaff_data.json', 'w') as f:
    json.dump(employees, f, indent=2)

print(f"Generated public/nonstaff_data.json with {len(employees)} records")
