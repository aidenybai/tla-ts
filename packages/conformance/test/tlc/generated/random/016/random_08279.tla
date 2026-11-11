(*---
description: Evaluates a random bool expression, seed 262, number 8279.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08279 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b12821 \in {b12822 \in (([x \in 1..2 |-> x])[-1] .. (3 \div -1)) : ([a |-> 2, b |-> {x \in 1..3 : x > 1}] = (FALSE * 2))} : (~((0 \div 1) = (CHOOSE r \in [a : {1, 2}] : TRUE)))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 75 to line 14, col 78 of module random_08279 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 73.
    | Expression starting at line 14, column 73.
    | ExtendableExpr starting at line 14, column 72.
    | ExtendableExpr starting at line 14, column 44.
    | Expression starting at line 14, column 44.
    | Fatal errors while parsing TLA+ spec in file random_08279
    | In module random_08279
    | Could not parse module random_08279 from file random_08279.tla
    | *** Errors: 1
    | In module random_08279
    | Could not parse module random_08279 from file random_08279.tla
    3002:1 Parsing or semantic analysis failed.
---*)
