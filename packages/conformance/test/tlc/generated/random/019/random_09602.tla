(*---
description: Evaluates a random function expression, seed 262, number 9602.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09602 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([[a |-> 0, b |-> TRUE] EXCEPT !.a = (-1 - 2)]).a :> (((\A b14906 \in 2..1 : TRUE) => (\E b14907 \in {2, 1, 3} : FALSE)) \/ ((--1) < (2 * 3)))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 145 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 142.
    | Expression starting at line 14, column 142.
    | ExtendableExpr starting at line 14, column 141.
    | ExtendableExpr starting at line 14, column 71.
    | Expression starting at line 14, column 71.
    | Fatal errors while parsing TLA+ spec in file random_09602
    | In module random_09602
    | Could not parse module random_09602 from file random_09602.tla
    | *** Errors: 1
    | In module random_09602
    | Could not parse module random_09602 from file random_09602.tla
    3002:1 Parsing or semantic analysis failed.
---*)
