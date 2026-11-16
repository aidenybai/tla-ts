(*---
description: function_merge_left applied to bag, a FcnRcdValue.
ref: tlc2/module/TLC.java#CombineFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_merge_left_bag ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SetToBag({1}) @@ (9 :> 9))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (1 :> 1 @@ 9 :> 9)"
---*)
