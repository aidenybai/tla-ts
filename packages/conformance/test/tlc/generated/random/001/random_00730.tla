(*---
description: Evaluates a random bool expression, seed 262, number 730.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00730 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Len([<<1, 2>> EXCEPT ![1] = <<1, 2>>]) % IF DOMAIN [x \in 1..2 |-> x] THEN (2147483647 * -1) ELSE ([a |-> 1, b |-> TRUE]).a) \in (LET b1203 == (1 + 2) IN IF TRUE THEN 2 ELSE b1203 .. ([b1204 \in {1, 2} |-> 1])[Cardinality({x \in 1..3 : x > 1})])))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 105 to line 14, col 105 of module random_00730 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 94.
    | Expression starting at line 14, column 94.
    | ExtendableExpr starting at line 14, column 93.
    | Expression starting at line 14, column 93.
    | IF THEN ELSE starting at line 14, column 59.
    | Fatal errors while parsing TLA+ spec in file random_00730
    | In module random_00730
    | Could not parse module random_00730 from file random_00730.tla
    | *** Errors: 1
    | In module random_00730
    | Could not parse module random_00730 from file random_00730.tla
    3002:1 Parsing or semantic analysis failed.
---*)
