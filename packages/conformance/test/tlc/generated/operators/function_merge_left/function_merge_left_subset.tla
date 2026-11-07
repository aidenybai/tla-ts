(*---
description: function_merge_left applied to subset, a SubsetValue.
ref: tlc2/module/TLC.java#CombineFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_merge_left_subset ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SUBSET {1, 2} @@ (9 :> 9))
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
