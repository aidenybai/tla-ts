(*---
description: Evaluates a random seq expression, seed 262, number 9751.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09751 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(Tail(([(1 :> 2) EXCEPT ![7] = (1 :> 2)])[Len(<<1, 2>>)]), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 32 to line 14, col 37 of module random_09751
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09751 failed.
    Attempted to apply function:
    <<2>>
    to argument 2, which is not in the domain of the function.
---*)
