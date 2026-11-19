import { describe, expect, it } from "vite-plus/test";
import { parseCommonJs } from "../../src/typescript/spec/cjs-lexer";

// Each case's names and re-exports are those that Node 26's cjs_lexer binding gives.
const CASES: [string, string[], string[]][] = [
  [
    "exports.a = 1; exports['b'] = 2; exports[\"c\\u0041\"] = 3; exports['\\ud800'] = 4;",
    ["a", "b", "cA"],
    [],
  ],
  [
    "module.exports = { a, b: c, 'd': e, ...require('./x'), f: require('./y'), get g() { return 1 } }",
    ["a", "b", "d", "f"],
    ["./x", "./y"],
  ],
  ["module.exports = require('./z');", [], ["./z"]],
  [
    "Object.defineProperty(exports, '__esModule', { value: true }); Object.defineProperty(exports, \"q\", { enumerable: true, get() { return m.q; } });",
    ["__esModule", "q"],
    [],
  ],
  [
    'Object.defineProperty(exports, "r", { enumerable: true, get: function get() { return m["r"]; } });',
    ["r"],
    [],
  ],
  [
    'var _x = require("./x"); Object.keys(_x).forEach(function (key) { if (key === "default" || key === "__esModule") return; if (key in exports && exports[key] === _x[key]) return; Object.defineProperty(exports, key, { enumerable: true, get: function () { return _x[key]; } }); });',
    [],
    ["./x"],
  ],
  [
    'var _y = _interopRequireWildcard(require("./y")); Object.keys(_y).forEach(function (key) { if (key === "default" || key === "__esModule") return; exports[key] = _y[key]; });',
    [],
    ["./y"],
  ],
  [
    "__export(require('./e')); __exportStar(require('./f'), exports); tslib.__exportStar(require('./g'), exports);",
    [],
    ["./e", "./f", "./g"],
  ],
  ["const a = /=/; exports.after = 1;", ["after"], []],
  ["const t = `${exports.x = 1}`; exports.y = 2;", ["x", "y"], []],
  ["if (a) /x/.test(b); exports.z = 1; x = y / 2 / 3; exports.w = 1", ["z", "w"], []],
  ["import('x'); exports.ok = 1;", ["ok"], []],
  ['import x from "y"; exports.no = 1;', [], []],
  ['{ "unterminated', [], []],
];

describe("finds a CommonJS module's exports as Node's lexer does", () => {
  it.each(CASES)("reads %j", (text, exports, reexports) => {
    expect(parseCommonJs(text)).toEqual({ exports, reexports });
  });

  it("rejects another result", () => {
    expect(parseCommonJs("exports.a = 1;")).not.toEqual({ exports: ["b"], reexports: [] });
  });
});
