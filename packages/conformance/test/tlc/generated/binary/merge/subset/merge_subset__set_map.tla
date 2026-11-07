(*---
description: merge of subset, a SubsetValue, and set_map, a SetEnumValue.
ref: tlc2/module/TLC.java#CombineFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE merge_subset__set_map ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SUBSET {1, 2}) @@ ({x + 1 : x \in 1..2}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of @@ should be a function, but instead it is:
    {{}, {1}, {2}, {1, 2}}
    2169:0 The first argument of @@ should be a function, but instead it is:
    {{}, {1}, {2}, {1, 2}}
---*)
