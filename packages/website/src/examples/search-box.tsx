// A React search box. Each key fetches, and the box shows whichever response arrives last.
type Query = "t" | "tl";

let query: Query | "" = "";
let results: Query | "" = "";
const sent = new Set<Query>();

export const SearchBox = () => (
  <>
    <label>
      Search <input value={query} onChange={(event) => type(event.target.value as Query)} />
    </label>
    <output>{results}</output>
  </>
);

export const type = (text: Query) => {
  query = text;
  sent.add(text);
};

export const respond = (text: Query) => {
  if (!sent.has(text)) return;
  sent.delete(text);
  results = text;
};

export const showsLatest = () => sent.size > 0 || results === query;

// React's development build counts the elements that each render makes, which the box doesn't show.
/** @view */
export const shown = () => [query, results, [...sent]];
