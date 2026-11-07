(*---
description: Evaluates a random bool expression, seed 262, number 3183.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03183 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((<<>> = [x \in Nat |-> x + 1]) => (TRUE \/ TRUE)) /\ (~(Nat = {1, 2}))) <=> (((FALSE /\ TRUE) /\ (0 < 0)) <=> (([a |-> 1] = [a |-> 1]) \/ (~TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03183 failed.
    To convert a function of form [x \in S |-> f(x)] to a tuple, the set S must be enumerable.
---*)
