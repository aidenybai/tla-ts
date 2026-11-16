(*---
description: Evaluates a random set expression, seed 262, number 5913.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05913 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({(([x \in 1..2 |-> x] @@ [x \in 1..2 |-> x]))[IF TRUE THEN [a |-> 1] ELSE 2], ((-1 * -1) \div ([a |-> 1]).a)} \cap (({b9120 \in FALSE : FALSE} \cup {-1 : b9121 \in {1, 2}}) \cap {b9122 \in (0 .. {1}) : (TRUE \/ TRUE)})))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 100 to line 14, col 100 of module random_05913 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 98.
    | Expression starting at line 14, column 97.
    | ExtendableExpr starting at line 14, column 96.
    | Expression starting at line 14, column 96.
    | ExtendableExpr starting at line 14, column 95.
    | Fatal errors while parsing TLA+ spec in file random_05913
    | In module random_05913
    | Could not parse module random_05913 from file random_05913.tla
    | *** Errors: 1
    | In module random_05913
    | Could not parse module random_05913 from file random_05913.tla
    3002:1 Parsing or semantic analysis failed.
---*)
