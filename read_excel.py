import pandas as pd
import sys

def read_file(file_path):
    print(f"\n--- Reading {file_path} ---")
    try:
        xls = pd.ExcelFile(file_path)
        for sheet in xls.sheet_names:
            print(f"\nSheet: {sheet}")
            df = pd.read_excel(file_path, sheet_name=sheet, nrows=3)
            print("Columns:", df.columns.tolist())
            print("Data preview:")
            print(df.to_string())
    except Exception as e:
        print(f"Error: {e}")

read_file("GAJI JUNI 2026.xlsx")
read_file("Slip Gaji Op JUNI'26.xlsx")
read_file("Slip Gaji Staff JUNI'26.xlsx")
