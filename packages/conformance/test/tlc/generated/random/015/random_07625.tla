(*---
description: Evaluates a random bool expression, seed 262, number 7625.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07625 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((UNION {(1..3 \cap {}), {2, 7}} \div ((CHOOSE b11732 \in SUBSET {1} : TRUE) % Len(<<3, 1, 2>>))) = (((--1) * (7 \div -1)) + (([a |-> 1, b |-> TRUE]).a + ([x \in 1..2 |-> x] + 3)))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops UNION in block line 14, col 18 to line 14, col 22 of module random_07625 and \div.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 24.
    | Expression starting at line 14, column 18.
    | ExtendableExpr starting at line 14, column 17.
    | Expression starting at line 14, column 17.
    | ExtendableExpr starting at line 14, column 16.
    | Fatal errors while parsing TLA+ spec in file random_07625
    | In module random_07625
    | Could not parse module random_07625 from file random_07625.tla
    | *** Errors: 1
    | In module random_07625
    | Could not parse module random_07625 from file random_07625.tla
    3002:1 Parsing or semantic analysis failed.
---*)
