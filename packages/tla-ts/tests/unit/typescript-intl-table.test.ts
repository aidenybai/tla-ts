import ts from "@typescript/typescript6";
import { describe, expect, it } from "vite-plus/test";
import { getHostIntl } from "../../src/typescript/spec/intl";

// A program that formats with a NumberFormat of a locale it computes, which may be any of the tags
// it writes, each the prefix and four letters: a language V8 has none of, or a variant of English.
const getTable = (count: number, prefix = "l") => {
  const tags = Array.from(
    { length: count },
    (_, index) =>
      `"${prefix}${[0, 1, 2, 3].map((digit) => String.fromCharCode(97 + (Math.floor(index / 26 ** digit) % 26))).join("")}"`,
  );
  const source = `const tags = [${tags.join(", ")}];\nnew Intl.NumberFormat(tags[0]).format(1);\n`;
  const sourceFile = ts.createSourceFile("spec.ts", source, ts.ScriptTarget.Latest, true);
  return getHostIntl([sourceFile], new Set(["Intl", "NumberFormat", "format"]))
    .definitions.map((definition) => definition.text)
    .join("\n");
};

describe("records an Intl object's answers while HostIntl's table has room for them", () => {
  it("records a format's answers for each locale a program may take", () => {
    const table = getTable(2);
    expect(table).toContain('"resolvedOptions"');
    expect(table).toContain('"formatToParts"');
  });

  it("records none past the bound, where the objects' options alone fill the table", () => {
    const table = getTable(5000, "en-l");
    expect(table).toContain('"resolvedOptions"');
    expect(table).not.toContain('"formatToParts"');
  });

  it("records the answers once for the locales V8 resolves to its default, as it resolves none", () => {
    const table = getTable(5000);
    expect(table).toContain("IntlDefaultLocales");
    expect(table).toContain('"formatToParts"');
  });
});
