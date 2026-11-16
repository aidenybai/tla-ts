(*---
description: Evaluates a random seq expression, seed 262, number 6667.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06667 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(SortSeq(SelectSeq({b10224 : b10224 \in {2, 1, 3}}, LAMBDA e : e > 0), LAMBDA p, q : p < q), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06667 failed.
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    {1, 2, 3}
---*)
