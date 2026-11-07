(*---
description: merge of set_of_functions, a SetOfFcnsValue, and subset, a SubsetValue.
ref: tlc2/module/TLC.java#CombineFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE merge_set_of_functions__subset ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([{1} -> {2, 3}]) @@ (SUBSET {1, 2}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of @@ should be a function, but instead it is:
    {<<2>>, <<3>>}
    2169:0 The first argument of @@ should be a function, but instead it is:
    {<<2>>, <<3>>}
---*)
