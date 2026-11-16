(*---
description: Evaluates a random record expression, seed 262, number 1476.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01476 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[(CHOOSE r \in [a : 2..1] : TRUE) EXCEPT !.a = (2147483647 - 0)] EXCEPT !.a = @ + ((--1) * Cardinality(FALSE))] EXCEPT !.a = IF (~([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE])) THEN (([a |-> 1, b |-> TRUE]).a - IF FALSE THEN 7 ELSE 7) ELSE Cardinality({b2360 \in {2, 1, 3} : FALSE})])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 104 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 101.
    | Expression starting at line 14, column 101.
    | ExtendableExpr starting at line 14, column 100.
    | ExtendableExpr starting at line 14, column 96.
    | Expression starting at line 14, column 96.
    | Fatal errors while parsing TLA+ spec in file random_01476
    | In module random_01476
    | Could not parse module random_01476 from file random_01476.tla
    | *** Errors: 1
    | In module random_01476
    | Could not parse module random_01476 from file random_01476.tla
    3002:1 Parsing or semantic analysis failed.
---*)
