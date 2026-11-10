(*---
description: Evaluates a random int expression, seed 262, number 8736.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08736 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE ([(CHOOSE r \in [a : {2, 1, 3}] : TRUE) EXCEPT ![1] = ([x \in 1..2 |-> x])[2147483647]] = [([x \in Nat |-> x + 1] @@ [x \in Nat |-> x + 1]) EXCEPT ![(-1 % 1..3)] = Head(<<3, 1, 2>>)]) -> IF (\E b13526 \in UNION {2..1, {x \in 1..3 : x > 1}} : ([x \in 1..2 |-> x] => TRUE)) THEN ([[a |-> 1] EXCEPT !.a = @ + 1]).a ELSE (-(CHOOSE r \in [a : {1, 2}] : TRUE)) [] OTHER -> LET b13527 == IF (FALSE /\ TRUE) THEN LET b13528 == 1 IN 3 ELSE Cardinality(SUBSET {1}) IN (([x \in Nat |-> x + 1] @@ (1 :> 2)))[([a |-> 1, b |-> TRUE] = [a |-> 1])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08736 failed.
    Attempted to access record by a non-string argument: 1
---*)
