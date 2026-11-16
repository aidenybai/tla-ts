(*---
description: Evaluates a random seq expression, seed 262, number 1633.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01633 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq([SubSeq(SortSeq(<<>>, LAMBDA p, q : p < q), (-1 \div -1), (7 \div 0)) EXCEPT ![1] = ((CHOOSE b2608 \in <<3, 1, 2>> : FALSE) \div Head((1 :> 2)))], LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 74 to line 14, col 77 of module random_01633 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 72.
    | Expression starting at line 14, column 71.
    | ExtendableExpr starting at line 14, column 70.
    | Expression starting at line 14, column 70.
    | Optional Arguments starting at line 14, column 33.
    | Fatal errors while parsing TLA+ spec in file random_01633
    | In module random_01633
    | Could not parse module random_01633 from file random_01633.tla
    | *** Errors: 1
    | In module random_01633
    | Could not parse module random_01633 from file random_01633.tla
    3002:1 Parsing or semantic analysis failed.
---*)
