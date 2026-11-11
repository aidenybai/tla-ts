(*---
description: Evaluates a random seq expression, seed 262, number 8171.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08171 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Tail(SelectSeq(<<1, 2>>, LAMBDA e : e > 0)) \o SortSeq(SortSeq(<<1, 2>>, LAMBDA p, q : p < q), LAMBDA p, q : p < q)) \o (SelectSeq(SortSeq(<<1>>, LAMBDA p, q : p < q), LAMBDA e : e > 0) \o SortSeq([<<>> EXCEPT ![1] = 0], LAMBDA p, q : p < q))))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 216 to line 14, col 219 of module random_08171
    | <<2, 1, 2, 1>>
---*)
