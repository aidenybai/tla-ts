(*---
description: Evaluates a random seq expression, seed 262, number 8837.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08837 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(SortSeq([SelectSeq(<<>>, LAMBDA e : e > 0) EXCEPT ![1] = (CHOOSE b13684 \in 1..3 : FALSE)], LAMBDA p, q : p < q), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 35 to line 14, col 67 of module random_08837
    | <<>>
---*)
