(*---
description: function_merge_left applied to tuple_mixed, a TupleValue.
ref: tlc2/module/TLC.java#CombineFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_merge_left_tuple_mixed ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<1, "a", {TRUE}>> @@ (9 :> 9))
====

(*--- recorded
all:
  exit: 0
  transcript: '| (1 :> 1 @@ 2 :> "a" @@ 3 :> {TRUE} @@ 9 :> 9)'
---*)
