import { describe, expect, it } from "vite-plus/test";
import { check } from "../../src";

const INNER = `---- MODULE Inner ----
CONSTANT _ ++ _, c
F(a, b) == a ++ b
G == 7 ++ 2
H == [x \\in {5, 7} |-> x ++ c]
Apply2(Op(_, _), a, b) == Op(a, b)
K == Apply2(++, 9, 4)
====`;

const checkAssumption = (definitions: string, assumption: string) =>
  check({
    source: `---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLE v\na ++ b == a + b + 100\n${definitions}\nASSUME ${assumption}\nInit == v = 0\nNext == v' = v\n====`,
    config: "INIT Init\nNEXT Next",
    loadModule: (name) => (name === "Inner" ? INNER : undefined),
  });

describe("operator symbols in INSTANCE substitutions match TLC", () => {
  it("passes an operator parameter of a LET instance to its substitutions", async () => {
    const result = await checkAssumption(
      `Op == LET I(_ ** _, d) == INSTANCE Inner WITH ++ <- **, c <- d
      IN <<I(\\div, 2)!F(7, 2), I(%, 2)!F(7, 2), I(\\div, 2)!G, I(%, 2)!G, I(^, 1)!G, I(%, 3)!H>>
Nested == LET I(_ ** _) == INSTANCE Inner WITH ++ <- **, c <- 2
              J(P(_, _)) == <<I(P)!G, I(P)!H>>
          IN <<J(\\div), J(%), J(^)>>`,
      `/\\ Op = <<3, 1, 3, 1, 49, (5 :> 2 @@ 7 :> 1)>>
       /\\ Nested = << <<3, (5 :> 2 @@ 7 :> 3)>>, <<1, (5 :> 1 @@ 7 :> 1)>>, <<49, (5 :> 25 @@ 7 :> 49)>> >>`,
    );
    expect(result.status).toBe("success");
  });

  it("substitutes a constant operator symbol that is passed as an operator argument", async () => {
    const result = await checkAssumption(
      `Named == INSTANCE Inner WITH ++ <- %, c <- 2
Implicit == INSTANCE Inner WITH c <- 2
Local == LET Q == INSTANCE Inner WITH ++ <- \\div, c <- 2 IN Q!K
Lambda == INSTANCE Inner WITH ++ <- LAMBDA x, y : x * y, c <- 2`,
      "<<Named!K, Implicit!K, Local, Lambda!K>> = <<1, 113, 2, 36>>",
    );
    expect(result.status).toBe("success");
  });
});
