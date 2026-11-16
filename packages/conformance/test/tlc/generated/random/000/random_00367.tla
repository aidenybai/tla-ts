(*---
description: Evaluates a random seq expression, seed 262, number 367.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00367 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(<<Head((<<1, 2>> \o <<5, 6>>)), (-(2 \div -1))>>, LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 63 to line 14, col 66 of module random_00367 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 61.
    | Expression starting at line 14, column 61.
    | ExtendableExpr starting at line 14, column 60.
    | Expression starting at line 14, column 59.
    | ExtendableExpr starting at line 14, column 58.
    | Fatal errors while parsing TLA+ spec in file random_00367
    | In module random_00367
    | Could not parse module random_00367 from file random_00367.tla
    | *** Errors: 1
    | In module random_00367
    | Could not parse module random_00367 from file random_00367.tla
    3002:1 Parsing or semantic analysis failed.
---*)
