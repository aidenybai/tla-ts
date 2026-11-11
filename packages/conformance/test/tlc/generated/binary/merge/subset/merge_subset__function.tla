(*---
description: merge of subset, a SubsetValue, and function, a FcnRcdValue.
ref: tlc2/module/TLC.java#CombineFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE merge_subset__function ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SUBSET {1, 2}) @@ ([x \in {1, 2} |-> x * 2]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module merge_subset__function failed.
    2169:0 The first argument of @@ should be a function, but instead it is:
    {{}, {1}, {2}, {1, 2}}
---*)
