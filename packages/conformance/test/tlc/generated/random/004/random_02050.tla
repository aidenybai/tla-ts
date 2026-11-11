(*---
description: Evaluates a random bool expression, seed 262, number 2050.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02050 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE ((-0) \in {b3258 : b3258 \in SUBSET {1}}) -> ([[a |-> 1] EXCEPT !.a = 0]).a [] OTHER -> (\A b3259 \in {b3260 : b3260 \in [a |-> 1, b |-> TRUE]} : ({} = {2, 1, 3})) = (((2147483647 % 1) \div ([a |-> 1]).a) \div Cardinality((FALSE \/ TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02050 failed.
    Attempted to check equality of the set {} with the value:
    0
---*)
