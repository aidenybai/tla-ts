(*---
description: Evaluates a random record expression, seed 262, number 671.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00671 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[{0, 1} EXCEPT !.a = Head(<<>>)] EXCEPT !.a = ((3 - 7) \div (7 - 1))] EXCEPT !.a = @ + (DOMAIN [[x \in Nat |-> x + 1] EXCEPT ![0] = 3] + (LET b1116 == 0 IN b1116 \div (CHOOSE b1117 \in {1} : FALSE)))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops DOMAIN in block line 14, col 106 to line 14, col 111 of module random_00671 and +.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 113.
    | Expression starting at line 14, column 106.
    | ExtendableExpr starting at line 14, column 105.
    | ExtendableExpr starting at line 14, column 101.
    | Expression starting at line 14, column 101.
    | Fatal errors while parsing TLA+ spec in file random_00671
    | In module random_00671
    | Could not parse module random_00671 from file random_00671.tla
    | *** Errors: 1
    | In module random_00671
    | Could not parse module random_00671 from file random_00671.tla
    3002:1 Parsing or semantic analysis failed.
---*)
