(*---
description: Evaluates a random seq expression, seed 262, number 9887.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09887 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(SelectSeq(SubSeq(SubSeq(<<1>>, 1, 2147483647), (-2147483647), (3 \div -1)), LAMBDA e : e > 0), (-IF (\A b15370 \in Nat : TRUE) THEN ([a |-> 1, b |-> TRUE]).a ELSE Head(<<1, 2>>)), Head(SortSeq(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q), LAMBDA p, q : p < q))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 88 to line 14, col 91 of module random_09887 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 86.
    | Expression starting at line 14, column 86.
    | ExtendableExpr starting at line 14, column 85.
    | Expression starting at line 14, column 85.
    | Optional Arguments starting at line 14, column 39.
    | Fatal errors while parsing TLA+ spec in file random_09887
    | In module random_09887
    | Could not parse module random_09887 from file random_09887.tla
    | *** Errors: 1
    | In module random_09887
    | Could not parse module random_09887 from file random_09887.tla
    3002:1 Parsing or semantic analysis failed.
---*)
