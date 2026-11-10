(*---
description: Evaluates a random seq expression, seed 262, number 7747.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07747 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SortSeq(SubSeq(<<2147483647, 2>>, (-1 % 3), (0 \div -1)), LAMBDA p, q : p < q), ([[[a |-> 1, b |-> TRUE] EXCEPT !.a = 1] EXCEPT !.a = (2 % -1)] % Head(Append(3, (1 :> 2))))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 70 to line 14, col 73 of module random_07747 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 68.
    | Expression starting at line 14, column 68.
    | ExtendableExpr starting at line 14, column 67.
    | Expression starting at line 14, column 67.
    | Optional Arguments starting at line 14, column 37.
    | Fatal errors while parsing TLA+ spec in file random_07747
    | In module random_07747
    | Could not parse module random_07747 from file random_07747.tla
    | *** Errors: 1
    | In module random_07747
    | Could not parse module random_07747 from file random_07747.tla
    3002:1 Parsing or semantic analysis failed.
---*)
