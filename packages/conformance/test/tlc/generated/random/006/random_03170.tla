(*---
description: Evaluates a random function expression, seed 262, number 3170.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03170 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b5049 \in {(7 \div -1), ([a |-> 1]).a} : (~{b5050 \in {1} : TRUE})) :> (-((2 \div 2) + (-2147483647)))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 39 to line 14, col 42 of module random_03170 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 37.
    | Expression starting at line 14, column 37.
    | ExtendableExpr starting at line 14, column 36.
    | Expression starting at line 14, column 36.
    | Some { } form starting at line 14, column 35.
    | Fatal errors while parsing TLA+ spec in file random_03170
    | In module random_03170
    | Could not parse module random_03170 from file random_03170.tla
    | *** Errors: 1
    | In module random_03170
    | Could not parse module random_03170 from file random_03170.tla
    3002:1 Parsing or semantic analysis failed.
---*)
