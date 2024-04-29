import fs from "fs";
export default class Utils {
    static extractJsonData(filename, pathname) {
        const jsonFilePath = `${pathname}/${filename}`;
        const jsonDataSync = fs.readFileSync(jsonFilePath, "utf8");
        const jsonData = JSON.parse(jsonDataSync);
        let data = Array.from(jsonData);
        return data;
    }
    // Path will be w.r.t to project
    static isFilePresent(filename, pathname) {
        return fs.existsSync(`${pathname}/${filename}`);
    }
    // Ensure that path is present (will be w.r.t project)
    static createEmptyJSONfile(filename, path) {
        const emptyData = [];
        fs.writeFile(`${path}/${filename}`, JSON.stringify(emptyData), (err) => {
            if (err) {
                console.error("Error creating file:", err);
                return;
            }
            console.log(`Empty JSON file ${path}/${filename} created successfully.`);
        });
    }
    static isFileEmpty(filename, pathname) {
        try {
            const stats = fs.statSync(pathname + filename);
            return stats.size === 0;
        }
        catch (error) {
            console.error("Error checking file:", error);
            return false;
        }
    }
    // TODO: define the type for finalData
    static appendinArrayOfObject(filename, finalData, pathname) {
        const fd = fs.openSync(`${pathname}/${filename}`, "r+");
        const buffer = Buffer.alloc(1);
        fs.readSync(fd, buffer, 0, 1, fs.statSync(`${pathname}/${filename}`).size - 2);
        fs.ftruncateSync(fd, fs.statSync(`${pathname}/${filename}`).size - 1);
        if (buffer.toString() === "[") {
            fs.writeSync(fd, "", fs.statSync(`${pathname}/${filename}`).size);
        }
        else {
            fs.writeSync(fd, ",", fs.statSync(`${pathname}/${filename}`).size);
        }
        fs.appendFileSync(`${pathname}/${filename}`, JSON.stringify(finalData));
        fs.writeSync(fd, "]", fs.statSync(`${pathname}/${filename}`).size);
        fs.closeSync(fd);
    }
}
//# sourceMappingURL=Utils.js.map