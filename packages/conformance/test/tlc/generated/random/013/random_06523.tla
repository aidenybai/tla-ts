(*---
description: Evaluates a random seq expression, seed 262, number 6523.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06523 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq([[[a |-> [x \in 1..2 |-> x], b |-> TRUE] EXCEPT !.a = @ + (1 % 7)] EXCEPT !.a = (UNION {{}, {1, 2}} \div Len(<<3, 1, 2>>))], LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops UNION in block line 14, col 105 to line 14, col 109 of module random_06523 and \div.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 111.
    | Expression starting at line 14, column 105.
    | ExtendableExpr starting at line 14, column 104.
    | Expression starting at line 14, column 104.
    | Except Spec starting at line 14, column 98.
    | Fatal errors while parsing TLA+ spec in file random_06523
    | In module random_06523
    | Could not parse module random_06523 from file random_06523.tla
    | *** Errors: 1
    | In module random_06523
    | Could not parse module random_06523 from file random_06523.tla
    3002:1 Parsing or semantic analysis failed.
---*)
