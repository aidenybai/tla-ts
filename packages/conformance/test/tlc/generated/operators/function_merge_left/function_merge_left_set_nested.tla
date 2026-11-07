(*---
description: function_merge_left applied to set_nested, a SetEnumValue.
ref: tlc2/module/TLC.java#CombineFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_merge_left_set_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({{1}, {}} @@ (9 :> 9))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of @@ should be a function, but instead it is:
    {{}, {1}}
    2169:0 The first argument of @@ should be a function, but instead it is:
    {{}, {1}}
---*)
