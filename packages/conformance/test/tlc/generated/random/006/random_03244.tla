(*---
description: Evaluates a random function expression, seed 262, number 3244.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03244 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE f \in [{1, 2} \ {1} -> {2, 1, 3}] : TRUE) @@ (([[a |-> 1, b |-> TRUE] EXCEPT !.a = 2]).a :> (DOMAIN <<5, 6>> * <<2147483647, 2>>))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops DOMAIN in block line 14, col 118 to line 14, col 123 of module random_03244 and *.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 125.
    | Expression starting at line 14, column 118.
    | ExtendableExpr starting at line 14, column 117.
    | ExtendableExpr starting at line 14, column 71.
    | Expression starting at line 14, column 71.
    | Fatal errors while parsing TLA+ spec in file random_03244
    | In module random_03244
    | Could not parse module random_03244 from file random_03244.tla
    | *** Errors: 1
    | In module random_03244
    | Could not parse module random_03244 from file random_03244.tla
    3002:1 Parsing or semantic analysis failed.
---*)
