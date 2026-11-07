(*---
description: merge of cross, a SetOfTuplesValue, and true, a BoolValue.
ref: tlc2/module/TLC.java#CombineFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE merge_cross__true ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1, 2} \X {3}) @@ (TRUE))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of @@ should be a function, but instead it is:
    {<<1, 3>>, <<2, 3>>}
    2169:0 The first argument of @@ should be a function, but instead it is:
    {<<1, 3>>, <<2, 3>>}
---*)
