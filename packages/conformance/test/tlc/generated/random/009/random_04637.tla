(*---
description: Evaluates a random int expression, seed 262, number 4637.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04637 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(SubSeq([Append(<<1, 2>>, 0) EXCEPT ![1] = (2 \div -1)], LET b7267 == ([x \in 1..2 |-> x])[-1] IN Head(<<1>>), ([a |-> 2147483647, b |-> TRUE] @@ (-1))), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 69 to line 14, col 72 of module random_04637 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 67.
    | Expression starting at line 14, column 67.
    | ExtendableExpr starting at line 14, column 66.
    | Expression starting at line 14, column 66.
    | Except Spec starting at line 14, column 59.
    | Fatal errors while parsing TLA+ spec in file random_04637
    | In module random_04637
    | Could not parse module random_04637 from file random_04637.tla
    | *** Errors: 1
    | In module random_04637
    | Could not parse module random_04637 from file random_04637.tla
    3002:1 Parsing or semantic analysis failed.
---*)
