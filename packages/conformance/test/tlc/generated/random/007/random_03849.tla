(*---
description: Evaluates a random record expression, seed 262, number 3849.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03849 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {1}] : TRUE) EXCEPT !.a = @ + (((--1) \div (-2147483647)) \div ((-2147483647) + (7 - 7)))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 71 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 68.
    | Expression starting at line 14, column 68.
    | ExtendableExpr starting at line 14, column 67.
    | Expression starting at line 14, column 67.
    | ExtendableExpr starting at line 14, column 66.
    | Fatal errors while parsing TLA+ spec in file random_03849
    | In module random_03849
    | Could not parse module random_03849 from file random_03849.tla
    | *** Errors: 1
    | In module random_03849
    | Could not parse module random_03849 from file random_03849.tla
    3002:1 Parsing or semantic analysis failed.
---*)
