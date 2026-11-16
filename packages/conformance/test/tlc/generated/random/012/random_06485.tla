(*---
description: Evaluates a random int expression, seed 262, number 6485.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06485 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF (([a |-> 1] = [a |-> 1, b |-> TRUE]) /\ ([a |-> 1] <=> TRUE)) THEN IF (-1 \in 2..1) THEN Len(<<1, 2>>) ELSE (FALSE).a ELSE IF (FALSE /\ TRUE) THEN (0 - -1) ELSE Head({}) + ((([a |-> 1, b |-> TRUE]).a * (-2147483647)) \div IF (<<3, 1, 2>> = <<5, 6>>) THEN Len(<<>>) ELSE Head(<<>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06485 failed.
    2283:0 The argument of Head should be a sequence, but instead it is:
    {}
---*)
