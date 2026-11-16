(*---
description: Evaluates a random bool expression, seed 262, number 8783.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08783 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((DOMAIN <<5, 6>> \cup (2..1 \cup 1..3)) \ (UNION {2..1, {2, 1, 3}} \cap {7, 2147483647})) \subseteq {b13605 \in {b13606 \in UNION {2147483647, 2..1} : (\E b13607 \in Nat : FALSE)} : (~(\A b13608 \in {} : FALSE))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08783 failed.
    Attempted to compare the set {} with the value:
    2147483647
---*)
