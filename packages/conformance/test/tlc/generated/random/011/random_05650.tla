(*---
description: Evaluates a random set expression, seed 262, number 5650.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05650 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE)).a .. Head(Tail(<<1>>))) \cap {IF [a |-> 0, b |-> FALSE] THEN CASE FALSE -> 3 [] OTHER -> 3 ELSE (-3), (([x \in Nat |-> x + 1] @@ [x \in Nat |-> x + 1]))[(-7)]}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05650 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
