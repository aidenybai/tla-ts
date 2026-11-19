/** @jsxImportSource ./runtime */
import type { Props } from "./runtime/jsx-runtime";

const Label = (props: Props) => <b>{props.text as string}!</b>;

const rest = { id: "rest", lang: "en" };
const count = 2;
const seen = [
  <a href="x" data-on {...rest} title={`t${count}`} />,
  <p key="first">
    one &amp; two
    {count > 1 && <i>{count as number}</i>}
    {/* nothing */}
    three
  </p>,
  <>
    <Label text="hi" />
    {...[1, 2].map((item: number) => <li key={item}>{item * count}</li>)}
  </>,
  <a {...rest} key="last" />,
  <svg:path a-b='"c"' />,
].join("\n");
const expected = `jsx:a(href=x,data-on=true,id=rest,lang=en,title=t2)
jsxs:p#first(children=[one & two|jsx:i(children=2)|three])
jsxs:fragment(children=[jsxs:b(children=[hi|!])|jsx:li#1(children=2)|jsx:li#2(children=4)])
createElement:a(id=rest,lang=en,key=last,children=[])
jsx:svg:path(a-b="c")`;
if (seen !== expected) throw new Error("seen " + seen);
