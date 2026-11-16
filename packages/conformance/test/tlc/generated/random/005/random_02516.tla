(*---
description: Evaluates a random seq expression, seed 262, number 2516.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02516 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~((CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE) = ((2 .. 3) \cup {[x \in Nat |-> x + 1] : b3969 \in {1, 2}}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02516 failed.
    Attempted to compute the number of elements in the overridden value Nat.
---*)
