(*---
description: merge of set_ints, a SetEnumValue, and set_diff, a SetDiffValue.
ref: tlc2/module/TLC.java#CombineFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE merge_set_ints__set_diff ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({2, 1}) @@ ({1, 2} \ {2}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module merge_set_ints__set_diff failed.
    2169:0 The first argument of @@ should be a function, but instead it is:
    {1, 2}
---*)
