import pandas as pd

def inspect_file(file):
    print(f"\n========== {file} ==========")
    try:
        xls = pd.ExcelFile(file)
        print("Sheets:", xls.sheet_names)
        for sheet in xls.sheet_names:
            print(f"\n--- Sheet: {sheet} ---")
            try:
                df = pd.read_excel(file, sheet_name=sheet, header=None, nrows=15)
                # print first few rows that are not entirely empty
                for idx, row in df.iterrows():
                    vals = [str(x) for x in row.values if pd.notnull(x) and str(x).strip() != ""]
                    if vals:
                        print(f"Row {idx}: {vals}")
            except Exception as e:
                print("Error reading sheet:", e)
    except Exception as e:
        print("Error opening file:", e)

inspect_file("GAJI JUNI 2026.xlsx")
