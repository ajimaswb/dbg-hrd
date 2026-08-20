import pandas as pd
import json
import math
import datetime

file = "Data Staff.xlsx"
df = pd.read_excel(file, sheet_name='Sheet1', header=0)

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
        "joinDate": joinDate,
        "bankName": "BCA", # Default
        "bankAccount": str(int(row['NO. REKENING'])) if pd.notna(row['NO. REKENING']) and type(row['NO. REKENING']) in [float, int] else str(row['NO. REKENING']) if pd.notna(row['NO. REKENING']) else "",
        "status": "aktif",
        "role": "employee",
        "components": {
            "gaji_pokok": int(row['GAJI POKOK']) if pd.notna(row['GAJI POKOK']) else 0,
            "tunjangan_jabatan": int(row['TUNJANGAN JABATAN']) if pd.notna(row['TUNJANGAN JABATAN']) else 0,
            "tunjangan_skill": int(row['TUNJANGAN SKILL']) if pd.notna(row['TUNJANGAN SKILL']) else 0,
            "tunjangan_insentif": int(row['TUNJANGAN INSENTIF']) if pd.notna(row['TUNJANGAN INSENTIF']) else 0,
            "tunjangan_masa_kerja": int(row['TUNJANGAN MASA KERJA']) if pd.notna(row['TUNJANGAN MASA KERJA']) else 0,
            "tunjangan_transport": int(row['TUNJANGAN TRANSPORT']) if pd.notna(row['TUNJANGAN TRANSPORT']) else 0,
            "tunjangan_absen": int(row['TUNJANGAN ABSEN']) if pd.notna(row['TUNJANGAN ABSEN']) else 0,
            "potongan_bpjs_tk": int(row['BPJS TK']) if pd.notna(row['BPJS TK']) else 0,
            "potongan_bpjs_kes": int(row['BPJS KES']) if pd.notna(row['BPJS KES']) else 0,
            "potongan_forum": int(row['FORUM']) if pd.notna(row['FORUM']) else 0,
            "potongan_ganti_rugi": int(row['GANTI RUGI']) if pd.notna(row['GANTI RUGI']) else 0,
            "potongan_kasbon": int(row['KASBOND']) if pd.notna(row['KASBOND']) else 0,
            "potongan_pokok_koperasi": int(row['POKOK KOPERASI']) if pd.notna(row['POKOK KOPERASI']) else 0,
            "potongan_koperasi_wajib": int(row['WAJIB KOPERASI']) if pd.notna(row['WAJIB KOPERASI']) else 0,
            "potongan_simpanan_bersama": int(row['SIMPANAN BERSAMA']) if pd.notna(row['SIMPANAN BERSAMA']) else 0,
            "potongan_angsuran_koperasi": int(row['ANGSURAN KOPERASI']) if pd.notna(row['ANGSURAN KOPERASI']) else 0
        }
    }
    if emp["nik"] == "nan": emp["nik"] = ""
    if emp["bankAccount"] == "nan": emp["bankAccount"] = ""
    
    employees.append(emp)

with open('public/staff_data.json', 'w') as f:
    json.dump(employees, f, indent=2)

print(f"Generated public/staff_data.json with {len(employees)} records")
