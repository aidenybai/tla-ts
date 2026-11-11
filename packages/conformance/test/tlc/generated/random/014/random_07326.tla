(*---
description: Evaluates a random function expression, seed 262, number 7326.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07326 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-(LET b11273 == -1 IN 2147483647 \div ([a |-> 1, b |-> TRUE]).a)) :> (Len(SubSeq(<<1, 2>>, 1, 0)) \div ((--1) \div (-1 \in 2..1)))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 125 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 122.
    | Expression starting at line 14, column 122.
    | ExtendableExpr starting at line 14, column 121.
    | ExtendableExpr starting at line 14, column 88.
    | Expression starting at line 14, column 88.
    | Fatal errors while parsing TLA+ spec in file random_07326
    | In module random_07326
    | Could not parse module random_07326 from file random_07326.tla
    | *** Errors: 1
    | In module random_07326
    | Could not parse module random_07326 from file random_07326.tla
    3002:1 Parsing or semantic analysis failed.
---*)
