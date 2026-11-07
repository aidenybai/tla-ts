(*---
description: Evaluates a random bool expression, seed 262, number 808.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00808 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((IF (\E b1322 \in {2, 1, 3} : TRUE) THEN CASE TRUE -> 2147483647 [] OTHER -> 3 ELSE (FALSE /\ 2..1) * CASE (\E b1323 \in 2..1 : FALSE) -> ([a |-> 1]).a [] OTHER -> (CHOOSE b1324 \in {1, 2} : TRUE)) \in ([a |-> (1 \div 0), b |-> (1 < -1)] = [(CHOOSE r \in [a : {1}] : TRUE) EXCEPT !.a = @ + Cardinality(SUBSET {1})])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
---*)
