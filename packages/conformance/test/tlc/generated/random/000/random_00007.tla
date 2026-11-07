(*---
description: Evaluates a random set expression, seed 262, number 7.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00007 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({([[<<5, 6>> EXCEPT ![[a |-> 1]] = 3] EXCEPT ![(-1 + 1)] = (0 \div 0)])[(([x \in 1..2 |-> x] @@ [x \in Nat |-> x + 1]) + (CHOOSE b12 \in [a |-> 1, b |-> TRUE] : FALSE))], IF (Head(<<1>>) \in ({2, 1, 3} \ {})) THEN Len(<<7, 0>>) ELSE (LET b13 == -1 IN b13 * (2 * -1))})
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 276 to line 14, col 276 of module random_00007 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 274.
    | Expression starting at line 14, column 274.
    | ExtendableExpr starting at line 14, column 273.
    | ExtendableExpr starting at line 14, column 267.
    | Expression starting at line 14, column 267.
    | Fatal errors while parsing TLA+ spec in file random_00007
    | In module random_00007
    | Could not parse module random_00007 from file random_00007.tla
    | *** Errors: 1
    | In module random_00007
    | Could not parse module random_00007 from file random_00007.tla
    3002:1 Parsing or semantic analysis failed.
---*)
