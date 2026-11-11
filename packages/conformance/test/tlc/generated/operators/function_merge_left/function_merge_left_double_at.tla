(*---
description: function_merge_left applied to double_at, a FcnRcdValue.
ref: tlc2/module/TLC.java#CombineFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_merge_left_double_at ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((1 :> 2) @@ (2 :> 3) @@ (9 :> 9))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (1 :> 2 @@ 2 :> 3 @@ 9 :> 9)"
---*)
