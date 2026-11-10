(*---
description: Evaluates a random function expression, seed 262, number 8300.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08300 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Head(SortSeq(<<>>, LAMBDA p, q : p < q)) + ((CHOOSE f \in [{} -> {}] : TRUE))[Len(<<1, 2>>)]) :> (((-1 * -1) % (3 - 1)) * ([a |-> 1, b |-> TRUE]).a)))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 121 to line 14, col 121 of module random_08300 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 119.
    | Expression starting at line 14, column 118.
    | ExtendableExpr starting at line 14, column 117.
    | Expression starting at line 14, column 117.
    | ExtendableExpr starting at line 14, column 116.
    | Fatal errors while parsing TLA+ spec in file random_08300
    | In module random_08300
    | Could not parse module random_08300 from file random_08300.tla
    | *** Errors: 1
    | In module random_08300
    | Could not parse module random_08300 from file random_08300.tla
    3002:1 Parsing or semantic analysis failed.
---*)
