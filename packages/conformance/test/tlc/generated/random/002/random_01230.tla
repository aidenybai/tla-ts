(*---
description: Evaluates a random bool expression, seed 262, number 1230.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01230 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([a |-> Cardinality({1, 2}), b |-> ({1} \subseteq {1, 2})]).a < ([[a |-> 2147483647, b |-> FALSE] EXCEPT !.a = (2 \div -1)]).a))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 131 to line 14, col 134 of module random_01230 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 129.
    | Expression starting at line 14, column 129.
    | ExtendableExpr starting at line 14, column 128.
    | Expression starting at line 14, column 128.
    | Except Spec starting at line 14, column 122.
    | Fatal errors while parsing TLA+ spec in file random_01230
    | In module random_01230
    | Could not parse module random_01230 from file random_01230.tla
    | *** Errors: 1
    | In module random_01230
    | Could not parse module random_01230 from file random_01230.tla
    3002:1 Parsing or semantic analysis failed.
---*)
