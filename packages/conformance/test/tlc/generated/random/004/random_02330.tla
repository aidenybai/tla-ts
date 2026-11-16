(*---
description: Evaluates a random bool expression, seed 262, number 2330.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02330 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 1] = (CHOOSE r \in [a : {1, 2}] : TRUE)) \/ ((-0) = [[a |-> 1, b |-> TRUE] EXCEPT !.a = 0])) \/ ([a |-> (2147483647 \div -1), b |-> (-1 \in SUBSET {1})] = (CHOOSE r \in [a : 1..2] : TRUE))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 175 to line 14, col 178 of module random_02330 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 164.
    | Expression starting at line 14, column 164.
    | ExtendableExpr starting at line 14, column 163.
    | Expression starting at line 14, column 163.
    | Field Value starting at line 14, column 157.
    | Fatal errors while parsing TLA+ spec in file random_02330
    | In module random_02330
    | Could not parse module random_02330 from file random_02330.tla
    | *** Errors: 1
    | In module random_02330
    | Could not parse module random_02330 from file random_02330.tla
    3002:1 Parsing or semantic analysis failed.
---*)
