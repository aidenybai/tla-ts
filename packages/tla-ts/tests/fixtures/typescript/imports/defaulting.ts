import made from "./defaulting";

export let seen = "";
const read = () => {
  try {
    seen = typeof made;
  } catch (error) {
    seen = error instanceof ReferenceError ? "reference" : "other";
  }
};
read();
export default class {}
