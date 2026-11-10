(*---
description: Evaluates a random seq expression, seed 262, number 3980.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03980 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(<<((2147483647 + 7) - (--1)), LET b6256 == (2147483647 + 2147483647) IN ([x \in Nat |-> x + 1])[b6256]>>, LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 51 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 48.
    | ExtendableExpr starting at line 14, column 29.
    | Expression starting at line 14, column 29.
    | ExtendableExpr starting at line 14, column 28.
    | Expression starting at line 14, column 28.
    | Fatal errors while parsing TLA+ spec in file random_03980
    | In module random_03980
    | Could not parse module random_03980 from file random_03980.tla
    | *** Errors: 1
    | In module random_03980
    | Could not parse module random_03980 from file random_03980.tla
    3002:1 Parsing or semantic analysis failed.
---*)
