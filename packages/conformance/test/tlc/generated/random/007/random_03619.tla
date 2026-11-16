(*---
description: Evaluates a random record expression, seed 262, number 3619.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03619 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> (-IF FALSE THEN 1 ELSE TRUE), b |-> ((CHOOSE b5714 \in {} : TRUE) < LET b5715 == 7 IN b5715)] EXCEPT !.a = ((Cardinality({2, 1, 3}) + Cardinality({1})) - ((2147483647 \div -1) * (-3)))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 191 to line 14, col 194 of module random_03619 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 180.
    | Expression starting at line 14, column 180.
    | ExtendableExpr starting at line 14, column 179.
    | Expression starting at line 14, column 179.
    | ExtendableExpr starting at line 14, column 178.
    | Fatal errors while parsing TLA+ spec in file random_03619
    | In module random_03619
    | Could not parse module random_03619 from file random_03619.tla
    | *** Errors: 1
    | In module random_03619
    | Could not parse module random_03619 from file random_03619.tla
    3002:1 Parsing or semantic analysis failed.
---*)
