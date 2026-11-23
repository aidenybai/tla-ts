import { render, type Props } from "./jsx-runtime";

export const createElement = (
  type: string | ((props: Props) => string),
  props: Props | null,
  ...children: unknown[]
) => render("createElement", type, { ...props, children }, undefined);
