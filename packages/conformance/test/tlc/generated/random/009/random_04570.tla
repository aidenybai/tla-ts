(*---
description: Evaluates a random record expression, seed 262, number 4570.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04570 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> IF (<<3, 1, 2>> = (1 :> 2)) THEN (CHOOSE b7168 \in 1..3 : TRUE) ELSE (CHOOSE b7169 \in {1} : [x \in Nat |-> x + 1]), b |-> (([a |-> 1, b |-> TRUE] = [a |-> 1]) /\ (2 < 1))] EXCEPT !.a = @ + ([a |-> (--1), b |-> (\E b7170 \in {2, 1, 3} : FALSE)]).a])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 225 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 222.
    | Expression starting at line 14, column 222.
    | Field Value starting at line 14, column 216.
    | Some [] Form starting at line 14, column 215.
    | ExtendableExpr starting at line 14, column 215.
    | Fatal errors while parsing TLA+ spec in file random_04570
    | In module random_04570
    | Could not parse module random_04570 from file random_04570.tla
    | *** Errors: 1
    | In module random_04570
    | Could not parse module random_04570 from file random_04570.tla
    3002:1 Parsing or semantic analysis failed.
---*)
