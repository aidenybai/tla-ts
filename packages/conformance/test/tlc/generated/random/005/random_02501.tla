(*---
description: Evaluates a random int expression, seed 262, number 2501.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02501 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality((((0 :> 1))[(-1 \div 3)] .. ((0 \div -1) \div LET b3936 == -1 IN b3936))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 60 to line 14, col 63 of module random_02501 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 58.
    | Expression starting at line 14, column 58.
    | ExtendableExpr starting at line 14, column 57.
    | Expression starting at line 14, column 57.
    | ExtendableExpr starting at line 14, column 56.
    | Fatal errors while parsing TLA+ spec in file random_02501
    | In module random_02501
    | Could not parse module random_02501 from file random_02501.tla
    | *** Errors: 1
    | In module random_02501
    | Could not parse module random_02501 from file random_02501.tla
    3002:1 Parsing or semantic analysis failed.
---*)
