(*---
description: Evaluates a random set expression, seed 262, number 642.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00642 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN (LET b1072 == (7 * -1) IN Cardinality(Nat) :> Cardinality(UNION {{x \in 1..3 : x > 1}, {2, 1, 3}})))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 40 to line 14, col 40 of module random_00642 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 38.
    | Expression starting at line 14, column 38.
    | ExtendableExpr starting at line 14, column 37.
    | Expression starting at line 14, column 37.
    | Definition starting at line 14, column 28.
    | Fatal errors while parsing TLA+ spec in file random_00642
    | In module random_00642
    | Could not parse module random_00642 from file random_00642.tla
    | *** Errors: 1
    | In module random_00642
    | Could not parse module random_00642 from file random_00642.tla
    3002:1 Parsing or semantic analysis failed.
---*)
