(*---
description: merge of tuple_mixed, a TupleValue, and boolean_set, a SetEnumValue.
ref: tlc2/module/TLC.java#CombineFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE merge_tuple_mixed__boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<1, "a", {TRUE}>>) @@ (BOOLEAN))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of @@ should be a function, but instead it is:
    {FALSE, TRUE}
    2169:0 The second argument of @@ should be a function, but instead it is:
    {FALSE, TRUE}
---*)
