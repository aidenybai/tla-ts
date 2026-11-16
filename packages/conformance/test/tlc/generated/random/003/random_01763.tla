(*---
description: Evaluates a random bool expression, seed 262, number 1763.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01763 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([(CHOOSE r \in [a : {2, 1, 3}] : TRUE) EXCEPT !.a = @ + (-1 \div -1)] = [[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 7] EXCEPT !.a = @ + (2147483647 - 2)]) => (Cardinality(DOMAIN [x \in 1..2 |-> x]) < (-([x \in 1..2 |-> x])[1]))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 78 to line 14, col 81 of module random_01763 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 76.
    | Expression starting at line 14, column 75.
    | ExtendableExpr starting at line 14, column 74.
    | ExtendableExpr starting at line 14, column 70.
    | Expression starting at line 14, column 70.
    | Fatal errors while parsing TLA+ spec in file random_01763
    | In module random_01763
    | Could not parse module random_01763 from file random_01763.tla
    | *** Errors: 1
    | In module random_01763
    | Could not parse module random_01763 from file random_01763.tla
    3002:1 Parsing or semantic analysis failed.
---*)
