(*---
description: Evaluates a random seq expression, seed 262, number 3613.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03613 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq((Tail(Append(<<>>, 1)) \o [SelectSeq(7, LAMBDA e : e > 0) EXCEPT ![1] = ([a |-> 1]).a]), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03613 failed.
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    7
---*)
