(*---
description: Evaluates a random bool expression, seed 262, number 4265.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04265 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((DOMAIN (CHOOSE f \in [1..2 -> {1, 2} \cap {2}] : TRUE) = ({b6713 \in ({2, 1, 3} \cap Nat) : (<<1, 2>> = [x \in Nat |-> x + 1])} \cap ((-1 .. 2147483647) \cap {1 : b6714 \in 1..3}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04265 failed.
    To convert a function of form [x \in S |-> f(x)] to a tuple, the set S must be enumerable.
---*)
