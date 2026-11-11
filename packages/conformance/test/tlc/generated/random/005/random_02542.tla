(*---
description: Evaluates a random seq expression, seed 262, number 2542.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02542 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(Len([Tail(<<>>) EXCEPT ![1] = UNION {2..1, {2, 1, 3}}])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02542 failed.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
