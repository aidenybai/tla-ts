(*---
description: merge of subset, a SubsetValue, and record_nested, a RecordValue.
ref: tlc2/module/TLC.java#CombineFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE merge_subset__record_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SUBSET {1, 2}) @@ ([a |-> [b |-> <<1>>]]))
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
