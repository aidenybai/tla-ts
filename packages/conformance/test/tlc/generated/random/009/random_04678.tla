(*---
description: Evaluates a random seq expression, seed 262, number 4678.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04678 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<(-((\E b7312 \in 1..3 : TRUE) \div Cardinality({2, 1, 3}))), Head(SubSeq(Append(<<1, 2>>, 3), (1 \div -1), (CHOOSE b7313 \in {1, 2} : FALSE)))>>)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 115 to line 14, col 118 of module random_04678 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 113.
    | Expression starting at line 14, column 113.
    | ExtendableExpr starting at line 14, column 112.
    | Expression starting at line 14, column 112.
    | Optional Arguments starting at line 14, column 90.
    | Fatal errors while parsing TLA+ spec in file random_04678
    | In module random_04678
    | Could not parse module random_04678 from file random_04678.tla
    | *** Errors: 1
    | In module random_04678
    | Could not parse module random_04678 from file random_04678.tla
    3002:1 Parsing or semantic analysis failed.
---*)
