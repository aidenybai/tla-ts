(*---
description: Evaluates a random bool expression, seed 262, number 281.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00281 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((\E b475 \in (1..3 \cap {1}) : <<b475, -1>>) \/ (([a |-> 1] = [a |-> 1]) \/ (FALSE \/ TRUE))) <=> (\A b476 \in ((2147483647 * {x \in 1..3 : x > 1}) .. (2147483647 % 2147483647)) : (SortSeq(<<1>>, LAMBDA p, q : p < q) = (b476 :> b476)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00281 failed.
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 19 to line 14, col 60 of module random_00281
---*)
