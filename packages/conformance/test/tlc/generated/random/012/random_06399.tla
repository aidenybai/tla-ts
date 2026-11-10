(*---
description: Evaluates a random bool expression, seed 262, number 6399.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06399 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~((([a |-> 1] = [x \in Nat |-> x + 1]) => (\E b9848 \in 1..3 : FALSE)) \/ ((Nat = 2..1) <=> (TRUE \/ FALSE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06399 failed.
    Attempted to compute the number of elements in the overridden value Nat.
---*)
