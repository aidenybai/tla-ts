(*---
description: merge of colon_greater, a FcnRcdValue, and set_of_functions, a SetOfFcnsValue.
ref: tlc2/module/TLC.java#CombineFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE merge_colon_greater__set_of_functions ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((1 :> 2) @@ ([{1} -> {2, 3}]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of @@ should be a function, but instead it is:
    {<<2>>, <<3>>}
    2169:0 The second argument of @@ should be a function, but instead it is:
    {<<2>>, <<3>>}
---*)
