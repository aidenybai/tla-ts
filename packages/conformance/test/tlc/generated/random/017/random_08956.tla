(*---
description: Evaluates a random int expression, seed 262, number 8956.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08956 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len(SortSeq(SelectSeq([<<>> EXCEPT ![1] = 2], LAMBDA e : e > 0), LAMBDA p, q : p < q)))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 39 to line 14, col 42 of module random_08956
    | 0
---*)
