(*---
description: Evaluates a random bool expression, seed 262, number 4994.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04994 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~(((CHOOSE f \in [{1, 2} -> {1, 2} \ {1}] : TRUE))[(2147483647 - 7)] \in (DOMAIN 2147483647 \ (0 .. 7)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04994 failed.
    Attempted to apply function:
    <<2, 2>>
    to argument 2147483640, which is not in the domain of the function.
---*)
