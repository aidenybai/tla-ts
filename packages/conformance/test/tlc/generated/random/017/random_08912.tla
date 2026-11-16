(*---
description: Evaluates a random bool expression, seed 262, number 8912.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08912 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((Nat \cap {x \in 1..3 : x > 1}) = (CHOOSE r \in [a : {0} \cup {1}] : TRUE)) /\ ([<<1, 2>> EXCEPT ![1] = 0] = ([x \in Nat |-> x + 1] @@ (1 :> 2)))) /\ (Len([TRUE EXCEPT ![1] = 0]) < ([b13812 \in [a |-> 1, b |-> TRUE] |-> b13812]).a)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08912 failed.
    Attempted to check equality of the set {2, 3} with the value:
    [a |-> 0]
---*)
