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

const h = (type: string, props: Props | null, ...children: unknown[]) =>
  `${type}(${Object.keys(props ?? {}).join(",")})[${children.join("|")}]`;

const seen = (
  <>
    <a href="x">text</a>
  </>
);
if (seen !== "group()[a(href)[text]]") throw new Error("seen " + seen);
