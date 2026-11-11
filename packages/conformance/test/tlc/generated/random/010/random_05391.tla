(*---
description: Evaluates a random bool expression, seed 262, number 5391.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05391 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((DOMAIN ((\A b8338 \in {} : FALSE) :> Len(<<3, 1, 2>>)) \subseteq DOMAIN (CHOOSE f \in [1..2 -> {1}] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05391 failed.
    Attempted to check if the value:
    TRUE
    is in the integer interval 1..2
---*)
