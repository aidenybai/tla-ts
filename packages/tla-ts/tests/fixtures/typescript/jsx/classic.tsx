/** @jsxRuntime classic */
/** @jsx h */
/** @jsxFrag Group */
interface Props {
  [name: string]: unknown;
}

declare global {
  namespace JSX {
    type Element = string;
    interface IntrinsicElements {
      [name: string]: Props;
    }
  }
}

const Group = "group";

const h = (
  type: string | ((props: Props) => string),
  props: Props | null,
  ...children: unknown[]
) =>
  typeof type === "function"
    ? type({ ...props, children })
    : `${type}(${Object.entries(props ?? {})
        .map((entry) => `${entry[0]}=${String(entry[1])}`)
        .join(",")})[${children.join("|")}]`;

const Total = (props: Props) => <b>total {props.of as number}</b>;

const rest = { id: "rest" };
const seen = [
  <a href="x" data-on {...rest} />,
  <>
    <Total of={3} />
    text
  </>,
].join("\n");
const expected = `a(href=x,data-on=true,id=rest)[]
group()[b()[total |3]|text]`;
if (seen !== expected) throw new Error("seen " + seen);
