(*---
description: Evaluates a random set expression, seed 262, number 5132.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05132 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((7 \div -1) :> ([a |-> 1]).a))[((CHOOSE f \in [{2, 1, 3} -> {}] : TRUE))[(-3)]] = LET b7977 == Len((<<3, 1, 2>> \o <<1>>)) IN Cardinality(DOMAIN <<5, 6>>)))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 22 to line 14, col 25 of module random_05132 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 20.
    | Expression starting at line 14, column 20.
    | ExtendableExpr starting at line 14, column 19.
    | Expression starting at line 14, column 19.
    | ExtendableExpr starting at line 14, column 18.
    | Fatal errors while parsing TLA+ spec in file random_05132
    | In module random_05132
    | Could not parse module random_05132 from file random_05132.tla
    | *** Errors: 1
    | In module random_05132
    | Could not parse module random_05132 from file random_05132.tla
    3002:1 Parsing or semantic analysis failed.
---*)
