import { describe, expect, it } from "vite-plus/test";
import { tokenize } from "../../src/lexer";
import { parseModule } from "../../src/parser";
import { getParsedTexts } from "../../src/tlc/order";
import { getJavaScriptModule, JAVASCRIPT_MODULE } from "../../src/typescript/javascript";

const getDefinedNames = (text: string) =>
  [...text.matchAll(/^(?:LOCAL )?([A-Z]\w*)(?:\(| ==)/gm)].map((match) => match[1]);

// The text a spec's view of the JavaScript module writes, which another process reads back, holds
// what the view links in process.
const expectWrittenAsLinked = (text: string) => {
  const view = getJavaScriptModule(text);
  const written = parseModule(view.text);
  expect(written.definitions.map((definition) => definition.name)).toEqual(
    view.module.definitions.map((definition) => definition.name),
  );
  const describeTokens = (tokens: typeof view.tokens) =>
    tokens.map((token) => [token.kind, token.text, token.line, token.column, token.endColumn]);
  expect(describeTokens(tokenize(view.text))).toEqual(describeTokens(view.tokens));
  // Its texts add to TLC's order of strings what its tokens add.
  expect([...new Set(view.texts?.parsed)]).toEqual([...new Set(getParsedTexts(view.tokens))]);
  expect([...new Set(view.texts?.strings)]).toEqual([
    ...new Set(view.tokens.flatMap((token) => (token.kind === "String" ? [token.text] : []))),
  ]);
};

describe("a spec's view of the JavaScript module", () => {
  it("writes text that parses to what it links for a spec that uses the Temporal module", () => {
    expectWrittenAsLinked("TUmalquraMonths TUmalquraStarts");
  });

  it("writes text that parses to what it links for specs that read other definitions", () => {
    const names = getDefinedNames(JAVASCRIPT_MODULE);
    expectWrittenAsLinked("");
    expectWrittenAsLinked(names.filter((_name, index) => index % 97 === 0).join(" "));
  });
});
