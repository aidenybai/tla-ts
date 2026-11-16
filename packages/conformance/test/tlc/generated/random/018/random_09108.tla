(*---
description: Evaluates a random set expression, seed 262, number 9108.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09108 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({((0 :> 7))[Head(<<>>)], ((2 * -1) * (0 + 3))} \cup ({(1 + 1), IF FALSE THEN 3 ELSE {x \in 1..3 : x > 1}} \cup ((-2147483647) .. Cardinality({x \in 1..3 : x > 1})))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 46 to line 14, col 46 of module random_09108 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 44.
    | Expression starting at line 14, column 44.
    | ExtendableExpr starting at line 14, column 43.
    | Expression starting at line 14, column 43.
    | ExtendableExpr starting at line 14, column 42.
    | Fatal errors while parsing TLA+ spec in file random_09108
    | In module random_09108
    | Could not parse module random_09108 from file random_09108.tla
    | *** Errors: 1
    | In module random_09108
    | Could not parse module random_09108 from file random_09108.tla
    3002:1 Parsing or semantic analysis failed.
---*)
