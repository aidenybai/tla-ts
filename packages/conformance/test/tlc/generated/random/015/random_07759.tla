(*---
description: Evaluates a random seq expression, seed 262, number 7759.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07759 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<(((2147483647 % 0) - Len(<<1, 2>>)) + (LET b11966 == 0 IN 2 - (2 * -1))), Head(Tail(SelectSeq(<<1>>, LAMBDA e : e > 0)))>>)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 83 to line 14, col 83 of module random_07759 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 81.
    | Expression starting at line 14, column 81.
    | ExtendableExpr starting at line 14, column 80.
    | ExtendableExpr starting at line 14, column 76.
    | Expression starting at line 14, column 76.
    | Fatal errors while parsing TLA+ spec in file random_07759
    | In module random_07759
    | Could not parse module random_07759 from file random_07759.tla
    | *** Errors: 1
    | In module random_07759
    | Could not parse module random_07759 from file random_07759.tla
    3002:1 Parsing or semantic analysis failed.
---*)
