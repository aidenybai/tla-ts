(*---
description: Evaluates a random seq expression, seed 262, number 6008.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06008 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq([(Tail(<<>>) \o <<1, 2>>) EXCEPT ![1] = Len(SubSeq([a |-> 1], 2, 2))], LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06008 failed.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
