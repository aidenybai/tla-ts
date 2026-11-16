(*---
description: Evaluates a random function expression, seed 262, number 565.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00565 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([(CHOOSE f \in [{1, 2} \ {1} -> {1, 2}] : TRUE) EXCEPT ![(SUBSET {1} % 3)] = (1 + 2147483647)] @@ [[b955 \in 3 |-> 1] EXCEPT ![(2147483647 - 0)] = {b956 \in {x \in 1..3 : x > 1} : TRUE}]) @@ [b957 \in (IF FALSE THEN [a |-> 1, b |-> TRUE] ELSE 2 :> (-2)) |-> ((-2147483647) * [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + b957])]))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops SUBSET in block line 14, col 76 to line 14, col 81 of module random_00565 and %.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 83.
    | Expression starting at line 14, column 76.
    | ExtendableExpr starting at line 14, column 75.
    | Expression starting at line 14, column 75.
    | Except Component starting at line 14, column 74.
    | Fatal errors while parsing TLA+ spec in file random_00565
    | In module random_00565
    | Could not parse module random_00565 from file random_00565.tla
    | *** Errors: 1
    | In module random_00565
    | Could not parse module random_00565 from file random_00565.tla
    3002:1 Parsing or semantic analysis failed.
---*)
