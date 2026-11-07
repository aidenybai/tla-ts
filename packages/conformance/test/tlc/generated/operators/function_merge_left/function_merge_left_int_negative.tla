(*---
description: function_merge_left applied to int_negative, a IntValue.
ref: tlc2/module/TLC.java#CombineFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_merge_left_int_negative ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(-3 @@ (9 :> 9))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of @@ should be a function, but instead it is:
    -3
    2169:0 The first argument of @@ should be a function, but instead it is:
    -3
---*)
