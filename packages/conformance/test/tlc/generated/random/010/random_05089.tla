(*---
description: Evaluates a random seq expression, seed 262, number 5089.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05089 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(SortSeq(SortSeq(Tail(<<1>>), LAMBDA p, q : p < q), LAMBDA p, q : p < q), Len(SelectSeq(SortSeq(<<1, 2>>, LAMBDA p, q : p < q), LAMBDA e : e > 0)), (((1 \div 1..3) + Cardinality(Nat)) - ((0 * 1) - (3 \div -1)))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 222 to line 14, col 225 of module random_05089 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 220.
    | Expression starting at line 14, column 220.
    | ExtendableExpr starting at line 14, column 219.
    | ExtendableExpr starting at line 14, column 209.
    | Expression starting at line 14, column 209.
    | Fatal errors while parsing TLA+ spec in file random_05089
    | In module random_05089
    | Could not parse module random_05089 from file random_05089.tla
    | *** Errors: 1
    | In module random_05089
    | Could not parse module random_05089 from file random_05089.tla
    3002:1 Parsing or semantic analysis failed.
---*)
