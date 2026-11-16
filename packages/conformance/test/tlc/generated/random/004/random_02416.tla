(*---
description: Evaluates a random int expression, seed 262, number 2416.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02416 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head(<<(3 % 7), (2 * -1)>>) * ((-(-1 % 1)) - ((1 + 3) \div Head(<<>>)))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 36 to line 14, col 36 of module random_02416 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 34.
    | Expression starting at line 14, column 34.
    | ExtendableExpr starting at line 14, column 33.
    | Expression starting at line 14, column 33.
    | Some << -- >> or >>_ Form starting at line 14, column 22.
    | Fatal errors while parsing TLA+ spec in file random_02416
    | In module random_02416
    | Could not parse module random_02416 from file random_02416.tla
    | *** Errors: 1
    | In module random_02416
    | Could not parse module random_02416 from file random_02416.tla
    3002:1 Parsing or semantic analysis failed.
---*)
