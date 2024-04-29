import puppeteer from "puppeteer-extra";
import stealthPlugin from "puppeteer-extra-plugin-stealth";
import cheerio from "cheerio";
import Utils from "./Utils.js";
export class GoogleParser {
    constructor(targetAreasPathName, target) {
        this.targetAreasPathName = targetAreasPathName;
        this.target = target;
        this.uniqueData = new Set();
        this.errorZip = new Map();
        this.targetAreas = this.getTargetedAreas();
    }
    // Read the input area files and store them in inputAreas
    getTargetedAreas() {
        const data = Utils.extractJsonData(this.target + ".json", this.targetAreasPathName);
        return data;
    }
    breakIntoIntervals(i, j, interval = 100) {
        const intervals = [];
        for (let start = i; start <= j; start += interval) {
            const end = Math.min(start + interval, j + 1);
            intervals.push({ start, end });
        }
        return intervals;
    }
    async parseData() {
        // Loop over the areas with the interval of 100 and then sleep for 5 seconds
        // CHANGE: interval
        const intervals = this.breakIntoIntervals(0, this.targetAreas.length, 2);
        console.log(intervals);
        for (const interval of intervals) {
            await this.run(this.target, interval.start, interval.end);
            await new Promise((resolve) => {
                console.log("Waiting for the next round of scrapping");
                setTimeout(function () {
                    console.log("Starting the scrapping");
                    resolve();
                }, 5000); // 5000 milliseconds = 5 seconds
            });
        }
    }
    async run(filename, l, r) {
        const fileExists = Utils.isFilePresent(filename + ".json", "./scrappedData");
        console.log("Do File Exist? -> ", fileExists);
        const startingPoint = l;
        const endpoint = r;
        const range = `${startingPoint} - ${endpoint}`;
        const selectedTargetAreas = this.targetAreas.slice(startingPoint, endpoint);
        if (!fileExists) {
            Utils.createEmptyJSONfile(filename + ".json", "./scrappedData");
        }
        try {
            const combinedResults = [];
            for (const targetArea of selectedTargetAreas) {
                const results = await this.searchGoogleMaps(targetArea, selectedTargetAreas);
                console.log("Shops near ", targetArea, " : size --> ", results.length);
                combinedResults.push(...results);
            }
            const finalData = {
                [range]: combinedResults,
            };
            Utils.appendinArrayOfObject(filename + ".json", finalData, "./scrappedData");
            console.log(`Data appended to ./scrappedData/${filename} successfully.`);
        }
        catch (error) {
            console.error("Error:", error);
        }
        return;
    }
    extractLatLongFromUrl(url) {
        const parts = url.split("!3d");
        if (parts.length >= 2) {
            const latLongPart = parts[1].split("!4d");
            if (latLongPart.length >= 2) {
                const latitude = parseFloat(latLongPart[0]);
                const longitude = parseFloat(latLongPart[1]);
                return { latitude, longitude };
            }
        }
        return null;
    }
    isContactNumber(str) {
        const regex = /^[+\d]/;
        return regex.test(str);
    }
    // TODO: find the type
    getCategory(parent) {
        return parent.text().split("·")[0]?.trim();
    }
    getstoreType(parent) {
        const openingHoursText = parent.find("div.fontBodyMedium").eq(1).text();
        return openingHoursText?.split("·")[0]?.trim();
    }
    async searchGoogleMaps(targetArea, selectedTargetAreas) {
        let browser;
        try {
            // @ts-ignore
            puppeteer.use(stealthPlugin());
            // @ts-ignore
            // browser = await puppeteer.launch({
            //   headless: true,
            //   executablePath: "/usr/bin/google-chrome",
            // });
            // @ts-ignore
            // const browser = await puppeteer.connect({
            //   browserWSEndpoint: "ws://localhost:3000",
            // });
            // @ts-ignore
            browser = await puppeteer.connect({
                browserWSEndpoint: "ws://localhost:3000",
                headless: true,
            });
            const page = await browser.newPage();
            const query = `shops near ${targetArea}`;
            await page.goto(`https://www.google.com/maps/search/${query.split(" ").join("+")}`);
            await page.waitForNavigation({ waitUntil: "networkidle0" });
            async function autoScroll(page) {
                await page.evaluate(async () => {
                    await new Promise((resolve, reject) => {
                        var totalHeight = 0;
                        var distance = 1000;
                        var scrollDelay = 3000;
                        var timer = setInterval(async () => {
                            var wrapper = document.querySelector('div[role="feed"]');
                            var scrollHeightBefore = wrapper.scrollHeight;
                            wrapper.scrollBy(0, distance);
                            totalHeight += distance;
                            if (totalHeight >= scrollHeightBefore) {
                                totalHeight = 0;
                                await new Promise((resolve) => setTimeout(resolve, scrollDelay));
                                var scrollHeightAfter = wrapper.scrollHeight;
                                if (scrollHeightAfter > scrollHeightBefore) {
                                    return;
                                }
                                else {
                                    clearInterval(timer);
                                    resolve();
                                }
                            }
                        }, 200);
                    });
                });
            }
            await autoScroll(page);
            const html = await page.content();
            const $ = cheerio.load(html);
            const businessData = [];
            $("a[href*='/maps/place/']").each((i, el) => {
                const url = $(el).attr("href");
                const parent = $(el).parent();
                const WrapperMain = parent.find("div.fontBodyMedium > div").eq(3);
                const storeName = parent.find("div.fontHeadlineSmall").text();
                // const website = parent.find('a[data-value="Website"]').attr("href");// wrong
                const ratingText = parent
                    .find("span.fontBodyMedium > span")
                    .attr("aria-label");
                const address = `${WrapperMain.children("div").eq(0).text().split("·")[1]?.trim()}`;
                const { latitude, longitude } = this.extractLatLongFromUrl(url);
                let status = "Avaliable";
                let phone = "";
                let arr = WrapperMain.children("div").eq(1).text().split("·");
                if (arr[0] === "Temporarily closed" ||
                    arr[0] === "Permanently closed") {
                    status = arr[0];
                }
                if (arr[1]) {
                    phone = arr[1];
                }
                else {
                    if (this.isContactNumber(arr[0])) {
                        phone = arr[0];
                    }
                }
                const placeId = url.split("?")[0].split("ChI")[1];
                if (!this.uniqueData.has(placeId)) {
                    this.uniqueData.add(placeId);
                    businessData.push({
                        place_id: placeId ? placeId : "NA",
                        address: address ? address : "NA",
                        category: this.getCategory(WrapperMain)
                            ? this.getCategory(WrapperMain)
                            : "NA",
                        phone_number: phone ? phone : "NA",
                        latitude: latitude ? latitude : "NA",
                        longitude: longitude ? longitude : "NA",
                        status: status ? status : "NA",
                        payload: JSON.stringify({
                            type: this.getstoreType(parent)
                                ? this.getstoreType(parent)
                                : "NA",
                            googleUrl: url ? url : "NA",
                            stars: ratingText?.split("stars")[0]?.trim()
                                ? Number(ratingText.split("stars")[0].trim())
                                : null,
                            numberOfReviews: ratingText
                                ?.split("stars")[1]
                                ?.replace("Reviews", "")
                                ?.trim()
                                ? Number(ratingText.split("stars")[1].replace("Reviews", "").trim())
                                : null,
                        }),
                        name: storeName ? storeName : "NA",
                        review: JSON.stringify({ rating: ratingText ? ratingText : "NA" }),
                    });
                }
            });
            await browser.close();
            return businessData;
        }
        catch (error) {
            if (this.errorZip.get(targetArea) <= 1) {
                selectedTargetAreas.push(targetArea);
                this.errorZip.set(targetArea, this.errorZip.get(targetArea) + 1);
            }
            console.error("Error in searchGoogleMaps:", targetArea);
            if (browser) {
                browser.close();
            }
            return [];
        }
    }
}
//# sourceMappingURL=GoogleParser.js.map