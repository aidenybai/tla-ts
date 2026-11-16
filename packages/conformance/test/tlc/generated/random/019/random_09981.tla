(*---
description: Evaluates a random seq expression, seed 262, number 9981.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09981 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(([SortSeq(<<>>, LAMBDA p, q : p < q) EXCEPT ![1] = (3 \div -1)] \o SubSeq([<<>> EXCEPT ![1] = 0], IF FALSE THEN 1 ELSE 7, Len(<<1, 2>>))), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 78 to line 14, col 81 of module random_09981 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 76.
    | Expression starting at line 14, column 76.
    | ExtendableExpr starting at line 14, column 75.
    | Expression starting at line 14, column 75.
    | Except Spec starting at line 14, column 68.
    | Fatal errors while parsing TLA+ spec in file random_09981
    | In module random_09981
    | Could not parse module random_09981 from file random_09981.tla
    | *** Errors: 1
    | In module random_09981
    | Could not parse module random_09981 from file random_09981.tla
    3002:1 Parsing or semantic analysis failed.
---*)
