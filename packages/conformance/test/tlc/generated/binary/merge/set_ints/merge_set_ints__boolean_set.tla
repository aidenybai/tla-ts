(*---
description: merge of set_ints, a SetEnumValue, and boolean_set, a SetEnumValue.
ref: tlc2/module/TLC.java#CombineFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE merge_set_ints__boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({2, 1}) @@ (BOOLEAN))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of @@ should be a function, but instead it is:
    {1, 2}
    2169:0 The first argument of @@ should be a function, but instead it is:
    {1, 2}
---*)
