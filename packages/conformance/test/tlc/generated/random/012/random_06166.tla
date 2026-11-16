(*---
description: Evaluates a random function expression, seed 262, number 6166.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06166 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(LET b9485 == (-0) IN IF TRUE THEN b9485 ELSE b9485 :> (-((1 :> 2))[7])) EXCEPT ![Cardinality({(b9486 % 2) : b9486 \in UNION {1..3, 1..3}})] = IF ((2147483647 % 0) < [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 7]) THEN Head(([a |-> 1, b |-> TRUE] \o <<1, 2>>)) ELSE IF (~FALSE) THEN IF FALSE THEN 2 ELSE 2 ELSE (0 * -1)])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 327 to line 14, col 327 of module random_06166 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 325.
    | Expression starting at line 14, column 325.
    | ExtendableExpr starting at line 14, column 324.
    | Expression starting at line 14, column 324.
    | IF THEN ELSE starting at line 14, column 279.
    | Fatal errors while parsing TLA+ spec in file random_06166
    | In module random_06166
    | Could not parse module random_06166 from file random_06166.tla
    | *** Errors: 1
    | In module random_06166
    | Could not parse module random_06166 from file random_06166.tla
    3002:1 Parsing or semantic analysis failed.
---*)
