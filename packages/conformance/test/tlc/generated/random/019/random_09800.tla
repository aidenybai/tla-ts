(*---
description: Evaluates a random int expression, seed 262, number 9800.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09800 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head(<<Tail(SubSeq(<<1>>, 2147483647, -1)), IF (<<1>> = [x \in Nat |-> x + 1]) THEN Len(<<>>) ELSE (1 * 1)>>))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
