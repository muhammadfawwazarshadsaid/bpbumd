import pandas as pd

files = [
    "/Users/arshad/Downloads/bpbumd/bpbumd/src/migrations/mock/Koreksi_Business Continuity Planning_PPSJ.xlsx",
    "/Users/arshad/Downloads/bpbumd/bpbumd/src/migrations/mock/Matriks Jakpro Business Continuity Planning_File_Final Version.xlsx",
    "/Users/arshad/Downloads/bpbumd/bpbumd/src/migrations/mock/Perumda Dharma Jaya-Matriks Rencana Aksi Diagnostic Performance Review FINAL.xlsx"
]

for f in files:
    try:
        df = pd.read_excel(f, sheet_name=0, header=2)
        print(f"--- {f.split('/')[-1]} ---")
        # Find column that might contain 'PIC' or 'Penanggung Jawab'
        pic_cols = [c for c in df.columns if 'PIC' in str(c).upper() or 'PENANGGUNG' in str(c).upper()]
        if pic_cols:
            print(f"PIC Col: {pic_cols[0]}")
            for val in df[pic_cols[0]].dropna().unique()[:5]:
                print(repr(val))
    except Exception as e:
        print(f"Error reading {f}: {e}")
