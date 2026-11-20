// A React search box. Each key sends a request.
// A test that types, then gets the response, passes.
type Query = "t" | "tl";

let query: Query | "" = "";
let results: Query | "" = "";
let sent = new Set<Query>();

export const type = (text: Query) => {
  query = text;
  sent.add(text);
};

export const respond = (text: Query) => {
  if (sent.has(text)) {
    sent.delete(text);
    if (text === query) results = text;
  }
};

export const showsLatest = () => sent.size > 0 || results === query;
