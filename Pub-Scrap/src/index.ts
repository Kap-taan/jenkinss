import { BoundaryChecker } from "./BoundaryChecker.js";
import { FormatConverter } from "./FormatConverter.js";
import { GoogleParser } from "./GoogleParser.js";
import Utils from "./Utils.js";

const main = async () => {
  const args = process.argv;
  let target = args[2];
  let targetAreasPathName = args[3];

  let shouldGoogleParse = args[4] === "true" ? true : false;
  let shouldSaveIntoCSV = args[5] === "true" ? true : false;
  let shouldUploadToAWS = args[6] === "true" ? true : false;

  if (shouldGoogleParse) {
    const googleParser = new GoogleParser(targetAreasPathName, target);
    await googleParser.parseData();
  }

  if (shouldSaveIntoCSV) {
    const withinBoundaryData = await BoundaryChecker.checkCoordinates(
      target,
      "./scrappedData",
    );
    FormatConverter.convertJsonToCsv(withinBoundaryData, target, "./data");
  }

  // Check if data is present in the csv file
  if (Utils.isFileEmpty(`${target}_outlets.csv`, "./data/")) {
    console.log("No data is generated hence not pushing to s3");
    return;
  }

  if (shouldUploadToAWS) {
   console.log("Uploaded to aws");
  }

  console.log("Process is completed");
};

main();
