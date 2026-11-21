import data from "./data.json";

const seen = [data.name].join();
if (seen !== "data") throw new Error("seen " + seen);
