(*---
description: function_merge_left applied to set_filter, a SetPredValue.
ref: tlc2/module/TLC.java#CombineFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_merge_left_set_filter ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({x \in 1..3 : x > 1} @@ (9 :> 9))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module function_merge_left_set_filter failed.
    2169:0 The first argument of @@ should be a function, but instead it is:
    {2, 3}
---*)
