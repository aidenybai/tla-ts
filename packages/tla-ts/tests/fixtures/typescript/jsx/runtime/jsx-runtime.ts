export interface Props {
  [name: string]: unknown;
}

export namespace JSX {
  export type Element = string;
  export interface IntrinsicElements {
    [name: string]: Props;
  }
  export interface ElementChildrenAttribute {
    children: unknown;
  }
}

type Type = string | ((props: Props) => string);

const getText = (value: unknown) => (Array.isArray(value) ? `[${value.join("|")}]` : String(value));

export const render = (call: string, type: Type, props: Props | null, key: unknown) =>
  typeof type === "function"
    ? type(props ?? {})
    : `${call}:${type}${key === undefined ? "" : `#${getText(key)}`}(${Object.entries(props ?? {})
        .map((entry) => `${entry[0]}=${getText(entry[1])}`)
        .join(",")})`;

export const Fragment = "fragment";

export const jsx = (type: Type, props: Props, key?: unknown) => render("jsx", type, props, key);

export const jsxs = (type: Type, props: Props, key?: unknown) => render("jsxs", type, props, key);
