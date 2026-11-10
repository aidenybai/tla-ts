(*---
description: Evaluates a random seq expression, seed 262, number 2825.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02825 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Tail(SortSeq(SortSeq(<<1>>, LAMBDA p, q : p < q), LAMBDA p, q : p < q)) \o <<((2147483647 :> 1))[(2 % 2)], ((3 * -1) \div (7 * 1))>>))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 128 to line 14, col 128 of module random_02825 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 126.
    | Expression starting at line 14, column 126.
    | ExtendableExpr starting at line 14, column 125.
    | Expression starting at line 14, column 125.
    | ExtendableExpr starting at line 14, column 124.
    | Fatal errors while parsing TLA+ spec in file random_02825
    | In module random_02825
    | Could not parse module random_02825 from file random_02825.tla
    | *** Errors: 1
    | In module random_02825
    | Could not parse module random_02825 from file random_02825.tla
    3002:1 Parsing or semantic analysis failed.
---*)
