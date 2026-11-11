(*---
description: Evaluates a random set expression, seed 262, number 6118.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06118 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({(DOMAIN FALSE % (TRUE - 7)), (CHOOSE b9417 \in DOMAIN <<5, 6>> : ({x \in 1..3 : x > 1} \subseteq {2, 1, 3}))} \ {b9418 \in (Len(<<3, 1, 2>>) .. Head(<<1>>)) : ((3 .. [x \in 1..2 |-> x]) \subseteq {b9418 : b9419 \in Nat})}))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops DOMAIN in block line 14, col 19 to line 14, col 24 of module random_06118 and %.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 26.
    | Expression starting at line 14, column 19.
    | ExtendableExpr starting at line 14, column 18.
    | Expression starting at line 14, column 18.
    | Some { } form starting at line 14, column 17.
    | Fatal errors while parsing TLA+ spec in file random_06118
    | In module random_06118
    | Could not parse module random_06118 from file random_06118.tla
    | *** Errors: 1
    | In module random_06118
    | Could not parse module random_06118 from file random_06118.tla
    3002:1 Parsing or semantic analysis failed.
---*)
