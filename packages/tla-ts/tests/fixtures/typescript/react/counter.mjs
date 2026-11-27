// A counter whose button a step clicks, which renders through React's scheduler and records the
// count it shows in an effect.
globalThis.performance = { now: () => 0 };
const React = (await import("react")).default;
const { render } = await import("./renderer.mjs");

let press;
let effects = 0;
const Counter = () => {
  const [count, setCount] = React.useState(0);
  React.useEffect(() => {
    effects = count;
  }, [count]);
  press = () => setCount((value) => value + 1);
  return React.createElement("text", null, "count: ", count);
};
const getText = render(React.createElement(Counter));

let presses = 0;
export const click = () => {
  if (presses >= 2) {
    presses = 2;
    return;
  }
  presses += 1;
  press();
};
export const showsPresses = () => getText() === `count: ${presses}` && effects === presses;
