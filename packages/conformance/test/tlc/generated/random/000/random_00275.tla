(*---
description: Evaluates a random seq expression, seed 262, number 275.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00275 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(SubSeq([SortSeq({2, 1, 3}, LAMBDA p, q : p < q) EXCEPT ![1] = Head(<<3, 1, 2>>)], ((3 :> -1))[(<<>> + 2)], (((1 :> 2))[-1] % CASE TRUE -> -1 [] OTHER -> 2147483647)), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00275 failed.
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    {1, 2, 3}
---*)
