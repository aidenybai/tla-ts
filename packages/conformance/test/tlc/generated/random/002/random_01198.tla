(*---
description: Evaluates a random record expression, seed 262, number 1198.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01198 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (IF <<2, 0>> THEN ([x \in Nat |-> x + 1] - -1) ELSE Cardinality([a |-> 1]) * ((TRUE => TRUE) - (--1))), b |-> (((7 * 1) * ((1 :> 2))[7]) < ((-2) + (CHOOSE b1927 \in <<5, 6>> : TRUE)))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 121 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 118.
    | ExtendableExpr starting at line 14, column 101.
    | Expression starting at line 14, column 101.
    | ExtendableExpr starting at line 14, column 100.
    | ExtendableExpr starting at line 14, column 75.
    | Fatal errors while parsing TLA+ spec in file random_01198
    | In module random_01198
    | Could not parse module random_01198 from file random_01198.tla
    | *** Errors: 1
    | In module random_01198
    | Could not parse module random_01198 from file random_01198.tla
    3002:1 Parsing or semantic analysis failed.
---*)
