"""Build a small, attributed ingredient lookup from the supplied WAFCT workbook."""
import json
from pathlib import Path
import openpyxl

root = Path(__file__).resolve().parents[3]
book = root / "WAFCT_2019.xlsx"
sheet = openpyxl.load_workbook(book, read_only=True, data_only=True)["03 NV_sum_39 (per 100g EP)"]
rows = sheet.iter_rows(values_only=True)
headers = next(rows)
idx = {str(value).split("\n")[0].strip(): i for i, value in enumerate(headers) if value}
fields = {
    "energyKcal": "Energy\n(kcal)", "proteinG": "Protein, total", "fatG": "Fat, total",
    "carbohydratesG": "Carbohydrate, available", "fibreG": "Fibre, total dietary",
    "calciumMg": "Calcium", "ironMg": "Iron", "folateMcg": "Folate, total",
    "vitaminCMg": "Vitamin C", "sodiumMg": "Sodium",
}
result = []
for row in rows:
    name = row[idx["Food name in English"]]
    if not name:
        continue
    nutrients = {}
    for key, prefix in fields.items():
        column = next((i for i, h in enumerate(headers) if h and (str(h).startswith(prefix) if key != "energyKcal" else str(h) == prefix)), None)
        value = row[column] if column is not None else None
        if isinstance(value, (int, float)):
            nutrients[key] = value
        elif isinstance(value, str) and value.strip() and "[" not in value and "]" not in value:
            try:
                nutrients[key] = float(value.strip())
            except ValueError:
                pass
    if not nutrients:
        continue
    result.append({"code": str(row[idx["Code"]]), "name": str(name), "sourceRef": str(row[idx["BiblioID/Source"]] or ""), "nutrientsPer100g": nutrients})

out = root / "apps" / "api" / "src" / "data" / "wafct-foods.json"
out.write_text(json.dumps(result, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print(f"Extracted {len(result)} foods with numeric nutrient data to {out}")
