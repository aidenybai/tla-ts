(*---
description: Evaluates a random record expression, seed 262, number 6566.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06566 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {1, 2}] : TRUE) EXCEPT !.a = ([a |-> (0 \div -1), b |-> (FALSE \/ TRUE)]).a])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 76 to line 14, col 79 of module random_06566 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 74.
    | Expression starting at line 14, column 74.
    | ExtendableExpr starting at line 14, column 73.
    | Expression starting at line 14, column 73.
    | Field Value starting at line 14, column 67.
    | Fatal errors while parsing TLA+ spec in file random_06566
    | In module random_06566
    | Could not parse module random_06566 from file random_06566.tla
    | *** Errors: 1
    | In module random_06566
    | Could not parse module random_06566 from file random_06566.tla
    3002:1 Parsing or semantic analysis failed.
---*)
