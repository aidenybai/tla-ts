(*---
description: Evaluates a random bool expression, seed 262, number 1713.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01713 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([a |-> (1 + 0), b |-> (FALSE \/ FALSE)] \ DOMAIN [(1 :> 2) EXCEPT ![-1] = 3]) = ((DOMAIN [x \in 1..2 |-> x] \ ({} \ {x \in 1..3 : x > 1})) \cap (([x \in Nat |-> x + 1] = 7) \cap {b2730 \in {1, 2} : TRUE}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 69 to line 14, col 74 of module random_01713
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01713 failed.
    Attempted to compute the number of elements in the overridden value Nat.
---*)
