(*---
description: Evaluates a random function expression, seed 262, number 8642.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08642 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(LET b13376 == 2 IN b13376 :> (2 - 7)) EXCEPT ![(IF 2147483647 THEN 2147483647 ELSE 2147483647 - (7 + 1))] = ([[x \in 1..2 |-> x] EXCEPT ![2147483647] = 2147483647])[[[a |-> 1] EXCEPT !.a = @ + 3]]] EXCEPT ![IF ({b13377 \in -1 : FALSE} \cup UNION {1..3, [x \in Nat |-> x + 1]}) THEN Cardinality(UNION {{1, 2}, {2, 1, 3}}) ELSE (-(1 * 3))] = LET b13378 == CASE (FALSE => TRUE) -> ([x \in 1..2 |-> x])[3] [] OTHER -> IF TRUE THEN 7 ELSE 7 IN Cardinality((1..3 \cap Nat))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08642 failed.
    A non-boolean expression (an integer) was used as the condition of an IF.
    line 14, col 67 to line 14, col 121 of module random_08642
---*)
