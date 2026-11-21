declare function setTimeout(callback: () => void): void;

let seen = "";
import("./throwing.ts").then(
  () => {
    seen = "fulfilled";
  },
  (error: unknown) => {
    seen = `${(error as Error).name}: ${(error as Error).message}`;
  },
);
setTimeout(() => {
  if (seen !== "TypeError: thrown as the module runs") throw new Error(seen);
});
