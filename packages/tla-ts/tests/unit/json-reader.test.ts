import { describe, expect, it } from "vite-plus/test";
import { readJson } from "../../src/json-reader";

const LENIENT_ERROR = "Use JsonReader.setStrictness(Strictness.LENIENT) to accept malformed JSON";

describe("readJson matches Gson's JsonParser", () => {
  it("reads lenient JSON", () => {
    expect(readJson("{a: 'b'}")).toEqual(new Map([["a", "b"]]));
    expect(readJson("/* c */ 1")).toEqual({ literal: "1" });
    expect(readJson("#x\n3")).toEqual({ literal: "3" });
    expect(readJson(")]}'\n[1]")).toEqual([{ literal: "1" }]);
    expect(readJson('{"a" => 1}')).toEqual(new Map([["a", { literal: "1" }]]));
    expect(readJson("[1;2]")).toEqual([{ literal: "1" }, { literal: "2" }]);
    expect(readJson("[1,]")).toEqual([{ literal: "1" }, null]);
    expect(readJson("tRuE")).toBe(true);
    expect(readJson("00")).toBe("00");
    expect(readJson("-")).toBe("-");
    expect(readJson("1".repeat(1030))).toBe("1".repeat(1030));
  });

  it("reads an empty document and a null followed by data as null", () => {
    expect(readJson("")).toBeNull();
    expect(readJson("  \n")).toBeNull();
    expect(readJson("null 2")).toBeNull();
  });

  it("rejects data after the value in strict mode", () => {
    expect(() => readJson("1 2")).toThrow(
      `com.google.gson.stream.MalformedJsonException: ${LENIENT_ERROR} at line 1 column 4 path $`,
    );
    expect(() => readJson("1 // d")).toThrow(
      `com.google.gson.stream.MalformedJsonException: ${LENIENT_ERROR} at line 1 column 4 path $`,
    );
    expect(() => readJson("\ufeff 1 2")).toThrow(
      `com.google.gson.stream.MalformedJsonException: ${LENIENT_ERROR} at line 1 column 5 path $`,
    );
    expect(() => readJson(")]}'\n 1 2")).toThrow(
      `com.google.gson.stream.MalformedJsonException: ${LENIENT_ERROR} at line 1 column 10 path $`,
    );
  });

  it("reports where malformed JSON fails", () => {
    expect(() => readJson('{"a":\n')).toThrow(
      "java.io.EOFException: End of input at line 2 column 1 path $.a",
    );
    expect(() => readJson('{"x":[1,{"y":}]}')).toThrow(
      "com.google.gson.stream.MalformedJsonException: Expected value at line 1 column 14 path $.x[1].y",
    );
    expect(() => readJson('{"a":1,}')).toThrow(
      "com.google.gson.stream.MalformedJsonException: Expected name at line 1 column 9 path $.a",
    );
    expect(() => readJson("{,}")).toThrow(
      "com.google.gson.stream.MalformedJsonException: Expected name at line 1 column 2 path $.",
    );
    expect(() => readJson("[1 2]")).toThrow(
      "com.google.gson.stream.MalformedJsonException: Unterminated array at line 1 column 5 path $[1]",
    );
    expect(() => readJson("/*/")).toThrow(
      "com.google.gson.stream.MalformedJsonException: Unterminated comment at line 1 column 3 path $",
    );
    expect(() => readJson('"\\uZZZZ"')).toThrow(
      "com.google.gson.stream.MalformedJsonException: Malformed Unicode escape \\uZZZZ at line 1 column 4 path $",
    );
    expect(() => readJson("[".repeat(256))).toThrow(
      `com.google.gson.stream.MalformedJsonException: Nesting limit 255 reached at line 1 column 257 path $${"[0]".repeat(255)}`,
    );
  });
});
