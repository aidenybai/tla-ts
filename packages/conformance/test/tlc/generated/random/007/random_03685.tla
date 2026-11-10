(*---
description: Evaluates a random int expression, seed 262, number 3685.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03685 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((--1) + Cardinality(SUBSET {1})) * IF (0 = 3) THEN (0 * 3) ELSE ((1 :> 2))[3]) % (((3 * 7) + ([a |-> 1]).a) - Head(Append(<<1>>, 2147483647)))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 22 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 19.
    | Expression starting at line 14, column 19.
    | ExtendableExpr starting at line 14, column 18.
    | Expression starting at line 14, column 18.
    | ExtendableExpr starting at line 14, column 17.
    | Fatal errors while parsing TLA+ spec in file random_03685
    | In module random_03685
    | Could not parse module random_03685 from file random_03685.tla
    | *** Errors: 1
    | In module random_03685
    | Could not parse module random_03685 from file random_03685.tla
    3002:1 Parsing or semantic analysis failed.
---*)
