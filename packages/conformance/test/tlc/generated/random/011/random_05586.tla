(*---
description: Evaluates a random int expression, seed 262, number 5586.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05586 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((-(-1 - 2)) - (-(-1))) - (Head(SubSeq([a |-> 1], -1, 2147483647)) * ((CHOOSE b8651 \in {1} : FALSE))[(-1 \div -1)])))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 123 to line 14, col 126 of module random_05586 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 121.
    | Expression starting at line 14, column 120.
    | ExtendableExpr starting at line 14, column 119.
    | Expression starting at line 14, column 119.
    | Some [] Form starting at line 14, column 118.
    | Fatal errors while parsing TLA+ spec in file random_05586
    | In module random_05586
    | Could not parse module random_05586 from file random_05586.tla
    | *** Errors: 1
    | In module random_05586
    | Could not parse module random_05586 from file random_05586.tla
    3002:1 Parsing or semantic analysis failed.
---*)
