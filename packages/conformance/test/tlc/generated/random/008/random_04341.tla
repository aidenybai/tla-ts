(*---
description: Evaluates a random int expression, seed 262, number 4341.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04341 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((\A b6838 \in 1..3 : FALSE) + Head(<<1>>)) - ((CHOOSE f \in [{} -> {}] : TRUE))[(3 \div 1)]) * ((Len(<<1>>))[Cardinality({x \in 1..3 : x > 1})] < LET b6839 == (3 * -1) IN IF TRUE THEN b6839 ELSE 3)))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 181 to line 14, col 181 of module random_04341 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 179.
    | Expression starting at line 14, column 179.
    | ExtendableExpr starting at line 14, column 178.
    | Expression starting at line 14, column 178.
    | Definition starting at line 14, column 169.
    | Fatal errors while parsing TLA+ spec in file random_04341
    | In module random_04341
    | Could not parse module random_04341 from file random_04341.tla
    | *** Errors: 1
    | In module random_04341
    | Could not parse module random_04341 from file random_04341.tla
    3002:1 Parsing or semantic analysis failed.
---*)
