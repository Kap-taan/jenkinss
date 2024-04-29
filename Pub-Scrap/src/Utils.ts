import { Boolean } from "aws-sdk/clients/timestreaminfluxdb.js";
import fs from "fs";

export default class Utils {
  static extractJsonData(filename: string, pathname: string): Object[] {
    const jsonFilePath = `${pathname}/${filename}`;
    const jsonDataSync = fs.readFileSync(jsonFilePath, "utf8");
    const jsonData = JSON.parse(jsonDataSync);
    let data = Array.from(jsonData);
    return data;
  }

  // Path will be w.r.t to project
  static isFilePresent(filename: string, pathname: string): Boolean {
    return fs.existsSync(`${pathname}/${filename}`);
  }

  // Ensure that path is present (will be w.r.t project)
  static createEmptyJSONfile(filename: string, path: string) {
    const emptyData = [];
    fs.writeFile(`${path}/${filename}`, JSON.stringify(emptyData), (err) => {
      if (err) {
        console.error("Error creating file:", err);
        return;
      }
      console.log(`Empty JSON file ${path}/${filename} created successfully.`);
    });
  }

  static isFileEmpty(filename: string, pathname: string) {
    try {
      const stats = fs.statSync(pathname + filename);
      return stats.size === 0;
    } catch (error) {
      console.error("Error checking file:", error);
      return false;
    }
  }

  // TODO: define the type for finalData
  static appendinArrayOfObject(
    filename: string,
    finalData: any,
    pathname: string,
  ) {
    const fd = fs.openSync(`${pathname}/${filename}`, "r+");

    const buffer = Buffer.alloc(1);
    fs.readSync(
      fd,
      buffer,
      0,
      1,
      fs.statSync(`${pathname}/${filename}`).size - 2,
    );

    fs.ftruncateSync(fd, fs.statSync(`${pathname}/${filename}`).size - 1);

    if (buffer.toString() === "[") {
      fs.writeSync(fd, "", fs.statSync(`${pathname}/${filename}`).size);
    } else {
      fs.writeSync(fd, ",", fs.statSync(`${pathname}/${filename}`).size);
    }

    fs.appendFileSync(`${pathname}/${filename}`, JSON.stringify(finalData));

    fs.writeSync(fd, "]", fs.statSync(`${pathname}/${filename}`).size);
    fs.closeSync(fd);
  }
}
