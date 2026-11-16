(*---
description: Evaluates a random seq expression, seed 262, number 3169.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03169 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SortSeq(((<<1, 2>> \o <<1>>) \o [<<>> EXCEPT ![1] = -1]), LAMBDA p, q : p < q) \o SelectSeq(SortSeq(SortSeq(<<1, 2>>, LAMBDA p, q : p < q), LAMBDA p, q : p < q), LAMBDA e : e > 0)))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 50 to line 14, col 53 of module random_03169
    | <<1, 1, 2, 1, 2>>
---*)
