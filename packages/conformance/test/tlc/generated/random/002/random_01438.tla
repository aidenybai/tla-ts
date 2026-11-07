(*---
description: Evaluates a random bool expression, seed 262, number 1438.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01438 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((\E b2301 \in DOMAIN [[x \in 1..2 |-> x] EXCEPT ![1] = 1] : ((b2301 < 0) \/ (TRUE \/ TRUE))) /\ (\E b2302 \in ((0 \div 1) .. (2147483647 * 0)) : IF (TRUE <=> FALSE) THEN (<<1>> = <<3, 1, 2>>) ELSE IF TRUE THEN -1 ELSE 7)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 114 to line 14, col 235 of module random_01438
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 114 to line 14, col 235 of module random_01438
---*)
