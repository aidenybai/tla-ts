(*---
description: function_merge_left applied to function, a FcnRcdValue.
ref: tlc2/module/TLC.java#CombineFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_merge_left_function ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([x \in {1, 2} |-> x * 2] @@ (9 :> 9))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (1 :> 2 @@ 2 :> 4 @@ 9 :> 9)"
---*)
