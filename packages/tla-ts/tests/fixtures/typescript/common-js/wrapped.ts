import wrapped from "./wrapped.cjs";
import counter from "./counter.cjs";

const seen = [wrapped.description, wrapped.inner, wrapped.isCached, counter.loads].join();
if (seen !== "wrapped:2,inner,true,2") throw new Error("seen " + seen);
