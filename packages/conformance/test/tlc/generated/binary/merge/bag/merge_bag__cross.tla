(*---
description: merge of bag, a FcnRcdValue, and cross, a SetOfTuplesValue.
ref: tlc2/module/TLC.java#CombineFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE merge_bag__cross ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SetToBag({1})) @@ ({1, 2} \X {3}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of @@ should be a function, but instead it is:
    {<<1, 3>>, <<2, 3>>}
    2169:0 The second argument of @@ should be a function, but instead it is:
    {<<1, 3>>, <<2, 3>>}
---*)
