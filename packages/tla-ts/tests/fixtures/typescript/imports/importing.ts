declare function setTimeout(callback: () => void): void;

let seen = "";
import("./exports.ts", {}).then((values) => {
  seen = `${Object.keys(values).join()} ${values.limit} ${values.default}`;
});
setTimeout(() => {
  if (seen !== "default,limit,local,renamed 3 42") throw new Error(seen);
});
