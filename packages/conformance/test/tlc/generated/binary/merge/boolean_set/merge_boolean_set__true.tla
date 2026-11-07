(*---
description: merge of boolean_set, a SetEnumValue, and true, a BoolValue.
ref: tlc2/module/TLC.java#CombineFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE merge_boolean_set__true ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((BOOLEAN) @@ (TRUE))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of @@ should be a function, but instead it is:
    {FALSE, TRUE}
    2169:0 The first argument of @@ should be a function, but instead it is:
    {FALSE, TRUE}
---*)
