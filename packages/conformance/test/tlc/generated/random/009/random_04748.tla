(*---
description: Evaluates a random seq expression, seed 262, number 4748.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04748 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(Append(SelectSeq({1, 0}, LAMBDA e : e > 0), (-([x \in 1..2 |-> x])[0])), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04748 failed.
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    {0, 1}
---*)
