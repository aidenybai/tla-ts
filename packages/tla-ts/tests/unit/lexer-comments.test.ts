import { describe, expect, it } from "vite-plus/test";
import { TlaSyntaxError } from "../../src/errors";
import { tokenize } from "../../src/lexer";

const getTexts = (body: string) =>
  tokenize(`---- MODULE Comments ----\n${body}\n====`)
    .slice(4, -2)
    .map((token) => token.text);

describe("block comments", () => {
  it("skips nested comments up to the matching close", () => {
    expect(getTexts("A == 1 (* a (* b *) c *) + 2")).toEqual(["A", "==", "1", "+", "2"]);
  });

  it("opens a comment at (* even when ) follows", () => {
    expect(getTexts("A == 3 (*)*) + 4")).toEqual(["A", "==", "3", "+", "4"]);
  });

  it("reads *) outside a comment as two operators, as SANY does", () => {
    expect(getTexts("A == 1 *) + 2")).toEqual(["A", "==", "1", "*", ")", "+", "2"]);
  });

  it("rejects a comment that never closes", () => {
    expect(() => getTexts("A == 1 (* a (* b *)")).toThrow(TlaSyntaxError);
  });
});
