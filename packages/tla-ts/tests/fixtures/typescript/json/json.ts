import data from "./data.json" with { type: "json" };
import reader from "./reader.cjs";

data.extra = "added";
const seen = [
  data.name,
  data.list.length,
  data.list[2].deep,
  data.nested.ok,
  data.nested.ratio,
  Object.keys(data).join("+"),
  reader.isSame,
  reader.data === data,
  reader.data.extra,
  reader.count,
].join();
if (seen !== "data,3,,true,-0.5,name+list+nested+extra,true,true,added,3")
  throw new Error("seen " + seen);
