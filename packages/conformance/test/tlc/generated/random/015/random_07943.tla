(*---
description: Evaluates a random function expression, seed 262, number 7943.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07943 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([((([a |-> 1, b |-> TRUE]).a * (-1 % 2147483647)) :> (CASE TRUE -> 2 [] OTHER -> 3 + Head(<<3, 1, 2>>))) EXCEPT ![(CHOOSE b12257 \in {LET b12258 == 7 IN 2, (CHOOSE b12259 \in {2, 1, 3} : <<3, 1, 2>>)} : (\A b12260 \in {b12261 \in Nat : TRUE} : (1..3 = {x \in 1..3 : x > 1})))] = IF (\E b12262 \in {b12263 : b12263 \in SUBSET {1}} : (2147483647 < b12262)) THEN ([b12264 \in 2..1 |-> b12264])[(2147483647 * -1)] ELSE ([[a |-> 1] EXCEPT !.a = <<>>]).a])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 419 to line 14, col 419 of module random_07943 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 408.
    | Expression starting at line 14, column 408.
    | ExtendableExpr starting at line 14, column 407.
    | Expression starting at line 14, column 407.
    | Some [] Form starting at line 14, column 406.
    | Fatal errors while parsing TLA+ spec in file random_07943
    | In module random_07943
    | Could not parse module random_07943 from file random_07943.tla
    | *** Errors: 1
    | In module random_07943
    | Could not parse module random_07943 from file random_07943.tla
    3002:1 Parsing or semantic analysis failed.
---*)
