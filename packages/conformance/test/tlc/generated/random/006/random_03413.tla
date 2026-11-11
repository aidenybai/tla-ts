(*---
description: Evaluates a random bool expression, seed 262, number 3413.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03413 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE r \in [a : 1..2] : TRUE) = [(CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE) EXCEPT !.a = (((1 :> 2))[-1] - (3 \div -1))]))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 131 to line 14, col 134 of module random_03413 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 129.
    | Expression starting at line 14, column 129.
    | ExtendableExpr starting at line 14, column 128.
    | ExtendableExpr starting at line 14, column 111.
    | Expression starting at line 14, column 111.
    | Fatal errors while parsing TLA+ spec in file random_03413
    | In module random_03413
    | Could not parse module random_03413 from file random_03413.tla
    | *** Errors: 1
    | In module random_03413
    | Could not parse module random_03413 from file random_03413.tla
    3002:1 Parsing or semantic analysis failed.
---*)
