(*---
description: Evaluates a random function expression, seed 262, number 1337.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01337 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((~((0 + FALSE) < (2147483647 \div -1))) \cap SortSeq(SelectSeq((<<1>> \o <<>>), LAMBDA e : e > 0), LAMBDA p, q : p < q)))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 46 to line 14, col 49 of module random_01337 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 35.
    | Expression starting at line 14, column 35.
    | ExtendableExpr starting at line 14, column 34.
    | ExtendableExpr starting at line 14, column 20.
    | Expression starting at line 14, column 20.
    | Fatal errors while parsing TLA+ spec in file random_01337
    | In module random_01337
    | Could not parse module random_01337 from file random_01337.tla
    | *** Errors: 1
    | In module random_01337
    | Could not parse module random_01337 from file random_01337.tla
    3002:1 Parsing or semantic analysis failed.
---*)
