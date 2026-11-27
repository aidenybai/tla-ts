// A React search box. Each key fetches, and the box shows whichever response arrives last.
import { useId, useState } from "react";
import { renderToString } from "react-dom/server";

type Query = "t" | "tl";

let query: Query | "" = "";
let results: Query | "" = "";
const sent = new Set<Query>();

const SearchBox = (props: { query: string; results: string }) => {
  const id = useId();
  const [text, setText] = useState(props.query);
  return (
    <>
      <label htmlFor={id}>Search</label>
      <input
        id={id}
        value={text}
        onChange={(event) => {
          setText(event.target.value);
          type(event.target.value as Query);
        }}
      />
      <output>{props.results}</output>
    </>
  );
};

const render = (): string => renderToString(<SearchBox query={query} results={results} />);

let html: string = render();

export const type = (text: Query) => {
  query = text;
  sent.add(text);
  html = render();
};

export const respond = (text: Query) => {
  if (!sent.has(text)) return;
  sent.delete(text);
  results = text;
  html = render();
};

export const showsLatest = () => sent.size > 0 || html.includes(`<output>${query}</output>`);
