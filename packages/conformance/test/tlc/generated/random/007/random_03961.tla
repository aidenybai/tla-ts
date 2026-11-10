(*---
description: Evaluates a random bool expression, seed 262, number 3961.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03961 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((DOMAIN (CHOOSE f \in [2..1 -> {2, 1, 3}] : TRUE) = (((0 % 2147483647) \div (2147483647 \div 2)) \div LET b6233 == (7 + 1) IN LET b6234 == b6233 IN b6233)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03961 failed.
    Attempted to check equality of the set {} with the value:
    0
---*)
