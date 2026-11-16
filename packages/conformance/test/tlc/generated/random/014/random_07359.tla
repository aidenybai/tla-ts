(*---
description: Evaluates a random bool expression, seed 262, number 7359.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07359 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head(Tail((2 :> 2147483647))) \in DOMAIN (CHOOSE f \in [{} -> {2, 1, 3}] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07359 failed.
    2283:0 The argument of Tail should be a sequence, but instead it is:
    (2 :> 2147483647)
---*)
