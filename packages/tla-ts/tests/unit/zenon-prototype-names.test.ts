import { describe, expect, it } from "vite-plus/test";
import { runZenon } from "../../src/prover/zenon/decide";

const PLAIN_NAMES = ["kkkkkkkkkkk", "mmmmmmmm", "nnnnnnn", "pppppppppppppp"];

const run = (names: string[]) =>
  runZenon(
    [
      `$hyp "h" (TLA.in ${names[0]} (${names[2]} ${names[1]} ${names[1]}))`,
      `$hyp "g" (${names[3]} ${names[0]})`,
      `$goal (/\\ (${names[3]} ${names[0]}) (TLA.in ${names[0]} (${names[2]} ${names[1]} ${names[1]})))`,
    ].join("\n"),
    { timeLimitMs: 60_000 },
  );

describe("Zenon symbols named like Object.prototype members", () => {
  it.each([
    [["constructor", "toString", "valueOf", "hasOwnProperty"]],
    [["toString", "constructor", "hasOwnProperty", "valueOf"]],
    [["valueOf", "hasOwnProperty", "constructor", "toString"]],
    [["hasOwnProperty", "valueOf", "toString", "constructor"]],
    [["__proto__", "isPrototypeOf", "__defineGetter__", "toLocaleString"]],
  ])("are searched and printed like any other symbol: %j", (names) => {
    const plain = run(PLAIN_NAMES);
    const named = run(names);
    expect(named.nodesSearched).toBe(plain.nodesSearched);
    expect(named.isar).toBe(
      plain.isar?.replace(
        new RegExp(PLAIN_NAMES.join("|"), "g"),
        (name) => names[PLAIN_NAMES.indexOf(name)],
      ),
    );
    expect(named.isar).toContain(`(${names[0]} \\\\in ${names[2]}(${names[1]}, ${names[1]}))`);
  });
});
