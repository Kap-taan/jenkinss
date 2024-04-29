import fs from "fs";

export class FormatConverter {
  private static flattenUniqueJSON(json) {
    const flatSet = new Set();
    const flatArray = [];
    json.forEach((obj) => {
      Object.keys(obj).forEach((key) => {
        obj[key].forEach((item) => {
          if (!flatSet.has(item.place_id)) {
            flatSet.add(item.place_id);
            const flatObj = { ...item };
            flatArray.push(flatObj);
          }
        });
      });
    });
    return flatArray;
  }

  private static convertToCSV(data) {
    if (!data || !data.length) {
      return "";
    }

    const headers = Object.keys(data[0]).join(",");
    let csv = `${headers}\n`;

    data.forEach((obj) => {
      const values = Object.values(obj)
        .map((val) => {
          if (typeof val === "string") {
            // Escape double quotes inside string values
            val = val.replace(/"/g, '""');
            // Wrap string with double quotes if it contains commas, newline characters, or double quotes
            // @ts-ignore
            if (val.includes(",") || val.includes("\n") || val.includes('"')) {
              return `"${val}"`;
            }
          }
          return val;
        })
        .join(",");

      csv += `${values}\n`;
    });

    return csv;
  }

  public static convertJsonToCsv(data, filename: string, pathname: string) {
    const flatData = this.flattenUniqueJSON(data);
    const csv = this.convertToCSV(flatData);
    fs.writeFileSync(`${pathname}/${filename}_outlets.csv`, csv, "utf8");

    console.log(`CSV data saved to ${filename}_output`);
  }
}
