(*---
description: function_merge_left applied to colon_greater, a FcnRcdValue.
ref: tlc2/module/TLC.java#CombineFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_merge_left_colon_greater ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(1 :> 2 @@ (9 :> 9))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (1 :> 2 @@ 9 :> 9)"
---*)
