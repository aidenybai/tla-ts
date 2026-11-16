(*---
description: Evaluates a random function expression, seed 262, number 5448.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05448 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE f \in [{1, 2} -> 2..1] : TRUE) @@ [(<<3, 1, 2>> :> 1) EXCEPT ![LET b8438 == 7 IN FALSE] = Append({}, 2)]) @@ ((-(0 * -1)) :> ((-3) + (0 \div 1)))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 141 to line 14, col 141 of module random_05448 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 139.
    | Expression starting at line 14, column 139.
    | ExtendableExpr starting at line 14, column 138.
    | Expression starting at line 14, column 137.
    | ExtendableExpr starting at line 14, column 136.
    | Fatal errors while parsing TLA+ spec in file random_05448
    | In module random_05448
    | Could not parse module random_05448 from file random_05448.tla
    | *** Errors: 1
    | In module random_05448
    | Could not parse module random_05448 from file random_05448.tla
    3002:1 Parsing or semantic analysis failed.
---*)
