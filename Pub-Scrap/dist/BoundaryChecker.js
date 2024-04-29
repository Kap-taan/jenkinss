import { polygon, multiPolygon, point, booleanPointInPolygon, } from "@turf/turf";
import readline from "readline";
import Utils from "./Utils.js";
export class BoundaryChecker {
    static async getCoordinatesData(target) {
        try {
            const osmResponse = await fetch(`https://nominatim.openstreetmap.org/search.php?q=${target}&polygon_geojson=1&format=jsonv2`);
            const osmData = await osmResponse.json();
            if (osmData.length === 0) {
                throw new Error("Please enter the correct city name");
            }
            let idx = 0;
            if (osmData.length > 1) {
                osmData.forEach((singleItem, index) => console.log(`${index} - ${singleItem.display_name}`));
                const readIdx = readline.createInterface({
                    input: process.stdin,
                    output: process.stdout,
                });
                const enteredValue = await new Promise((resolve) => {
                    readIdx.question("What is your city idx? ", resolve);
                });
                const idxNumber = parseInt(enteredValue);
                if (isNaN(idxNumber) || idxNumber < 0 || idxNumber >= osmData.length) {
                    throw new Error("Invalid city index");
                }
                idx = idxNumber;
                readIdx.close();
            }
            const geojsonType = osmData[idx].geojson.type.toLowerCase();
            if (geojsonType.includes("polygon")) {
                return osmData[idx].geojson.coordinates;
            }
            // Specific boundaries are not present
            return this.createCoordinatesFromBoundaryValues(osmData[idx].boundingbox);
        }
        catch (error) {
            throw new Error("Error fetching coordinates data: " + error.message);
        }
    }
    // Create coordinates if coordinates are not present
    static createCoordinatesFromBoundaryValues(boundingBox) {
        // First two are latitude and last two are longitude
        return [
            [
                [
                    Math.min(boundingBox[2], boundingBox[3]),
                    Math.min(boundingBox[0], boundingBox[1]),
                ],
                [
                    Math.max(boundingBox[2], boundingBox[3]),
                    Math.min(boundingBox[0], boundingBox[1]),
                ],
                [
                    Math.max(boundingBox[2], boundingBox[3]),
                    Math.max(boundingBox[0], boundingBox[1]),
                ],
                [
                    Math.min(boundingBox[2], boundingBox[3]),
                    Math.max(boundingBox[0], boundingBox[1]),
                ],
                // closing the boundary
                [
                    Math.min(boundingBox[2], boundingBox[3]),
                    Math.min(boundingBox[0], boundingBox[1]),
                ],
            ],
        ];
    }
    static async checkCoordinates(target, pathname) {
        const coordinatesArray = await this.getCoordinatesData(target);
        const businessData = Utils.extractJsonData(target + ".json", pathname);
        try {
            const { finalData, count } = await this.getBoundaryData(coordinatesArray, businessData);
            console.log("Count which is out of boundary --> ", count);
            return finalData;
        }
        catch (error) {
            console.error("Error in checkCoordinates:", error);
            return [];
        }
    }
    static async getBoundaryData(coordinatesdata, data) {
        const finalData = [];
        let count = 0;
        let polygonFigure;
        if (coordinatesdata.length === 1) {
            polygonFigure = polygon(coordinatesdata);
        }
        else {
            polygonFigure = multiPolygon(coordinatesdata);
        }
        for (const value of data) {
            const values = {};
            for (const key in value) {
                const records = value[key];
                const validRecords = [];
                for (const record of records) {
                    const pointCoords = [record.longitude, record.latitude];
                    const point1 = point(pointCoords);
                    const isPointInsidePolygon = booleanPointInPolygon(point1, polygonFigure);
                    if (isPointInsidePolygon) {
                        validRecords.push(record);
                    }
                    else {
                        count++;
                    }
                }
                values[key] = validRecords;
            }
            finalData.push(values);
        }
        return { finalData, count };
    }
}
//# sourceMappingURL=BoundaryChecker.js.map