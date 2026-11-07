(*---
description: merge of tuple_empty, a TupleValue, and subset, a SubsetValue.
ref: tlc2/module/TLC.java#CombineFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE merge_tuple_empty__subset ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<>>) @@ (SUBSET {1, 2}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of @@ should be a function, but instead it is:
    {{}, {1}, {2}, {1, 2}}
    2169:0 The second argument of @@ should be a function, but instead it is:
    {{}, {1}, {2}, {1, 2}}
---*)
