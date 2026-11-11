(*---
description: Evaluates a random bool expression, seed 262, number 5037.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05037 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((({-1, 3} = (CHOOSE r \in [a : {2, 1, 3}] : TRUE)) /\ ((2147483647 - 0) < (2 * 7))) <=> (((7 + 2147483647) \in UNION {SUBSET {1}, 1..3}) \/ (~(\E b7831 \in {1, 2} : FALSE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05037 failed.
    Attempted to check equality of the set {-1, 3} with the value:
    [a |-> 1]
---*)
