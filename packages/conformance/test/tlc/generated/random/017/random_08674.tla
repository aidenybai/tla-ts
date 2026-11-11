(*---
description: Evaluates a random bool expression, seed 262, number 8674.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08674 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF (~(TRUE => TRUE)) THEN CASE (<<1>> = TRUE) -> (-1 \div 2147483647) [] OTHER -> Head(<<1>>) ELSE (([x \in Nat |-> x + 1])[3] + LET b13425 == 2 IN b13425) < CASE (~(2 = 2)) -> (Head(<<1>>) + (TRUE <=> TRUE)) [] OTHER -> Head(SelectSeq(<<>>, LAMBDA e : e > 0))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08674 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
