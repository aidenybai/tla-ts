import conditional from "conditional";
import text from "conditional/utils/text";
import legacy from "legacy";

const seen = [
  conditional.kind,
  conditional.required,
  conditional.feature,
  text.name,
  legacy.name,
  legacy.dependency,
].join();
if (seen !== "import,require,feature,text,legacy,dep") throw new Error("seen " + seen);
