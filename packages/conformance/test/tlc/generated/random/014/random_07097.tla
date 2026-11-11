(*---
description: Evaluates a random int expression, seed 262, number 7097.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07097 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-(Cardinality(SUBSET {1}) - (-1 + 0))) + LET b10900 == (([a |-> 1]).a + (--1)) IN IF <<b10900, b10900>> THEN IF FALSE THEN 2 ELSE b10900 ELSE Cardinality(2..1)))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 93 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 90.
    | ExtendableExpr starting at line 14, column 74.
    | Expression starting at line 14, column 74.
    | ExtendableExpr starting at line 14, column 73.
    | Expression starting at line 14, column 73.
    | Fatal errors while parsing TLA+ spec in file random_07097
    | In module random_07097
    | Could not parse module random_07097 from file random_07097.tla
    | *** Errors: 1
    | In module random_07097
    | Could not parse module random_07097 from file random_07097.tla
    3002:1 Parsing or semantic analysis failed.
---*)
