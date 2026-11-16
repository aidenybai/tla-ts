(*---
description: Evaluates a random int expression, seed 262, number 907.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00907 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF ((\A b1458 \in {2147483647, 7} : [a |-> b1458, b |-> TRUE]) => (Len([x \in Nat |-> x + 1]) \in {b1459 \in {1} : FALSE})) THEN ([(CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE) EXCEPT !.a = LET b1460 == 2 IN <<5, 6>>] - ([b1461 \in 2..1 |-> 2147483647])[(2 :> -1)]) ELSE Head((SubSeq({1, 2}, 7, 7) \o [<<>> EXCEPT ![1] = 2147483647])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00907 failed.
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 21 to line 14, col 76 of module random_00907
---*)
