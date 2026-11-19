// A React search box. Each key fetches.
type Query = "t" | "tl";

let query: Query | "" = "";
let results: Query | "" = "";
let sent = new Set<Query>();

export const type = (text: Query) => {
  query = text;
  sent.add(text);
};

export const respond = (text: Query) => {
  if (!sent.has(text)) return;
  sent.delete(text);
  results = text;
};

export const showsLatest = () => {
  return sent.size > 0 || results === query;
};
