(*---
description: Evaluates a random seq expression, seed 262, number 2646.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02646 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq([SortSeq(SubSeq(<<>>, 2, 0), LAMBDA p, q : p < q) EXCEPT ![1] = Len((CHOOSE f \in [1..2 -> {1, 2} \ {1}] : TRUE))], LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 27 to line 14, col 74 of module random_02646
    | <<>>
---*)
