(*---
description: Evaluates a random bool expression, seed 262, number 1082.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01082 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((\E b1726 \in ({-1, 7} \cap {0, 0}) : ({-1, 2} \subseteq {2147483647, b1726})) \/ (((-1 .. 2147483647) \cap (-1 .. 0)) = (Cardinality({2, 1, 3}) .. (0 - 7)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01082 failed.
    Size of interval value exceeds the maximum representable size (32bits): -1..2147483647.
---*)
