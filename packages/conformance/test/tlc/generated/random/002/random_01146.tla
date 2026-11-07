(*---
description: Evaluates a random set expression, seed 262, number 1146.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01146 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(-LET b1837 == (0 - 2) IN ((1 :> 2))[-1]), (-((--1) - Len(<<3, 1, 2>>)))})
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 66 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 63.
    | Expression starting at line 14, column 63.
    | ExtendableExpr starting at line 14, column 62.
    | Expression starting at line 14, column 61.
    | ExtendableExpr starting at line 14, column 60.
    | Fatal errors while parsing TLA+ spec in file random_01146
    | In module random_01146
    | Could not parse module random_01146 from file random_01146.tla
    | *** Errors: 1
    | In module random_01146
    | Could not parse module random_01146 from file random_01146.tla
    3002:1 Parsing or semantic analysis failed.
---*)
