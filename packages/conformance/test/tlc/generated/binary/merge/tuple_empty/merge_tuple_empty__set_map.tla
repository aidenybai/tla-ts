(*---
description: merge of tuple_empty, a TupleValue, and set_map, a SetEnumValue.
ref: tlc2/module/TLC.java#CombineFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE merge_tuple_empty__set_map ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<>>) @@ ({x + 1 : x \in 1..2}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of @@ should be a function, but instead it is:
    {2, 3}
    2169:0 The second argument of @@ should be a function, but instead it is:
    {2, 3}
---*)
