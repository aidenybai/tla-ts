// A project whose tsconfig.json sets baseUrl, which TypeScript 6 deprecates.
const seen = [1, 2, 3].map((value) => value * 2).join();
if (seen !== "2,4,6") throw new Error("seen " + seen);
