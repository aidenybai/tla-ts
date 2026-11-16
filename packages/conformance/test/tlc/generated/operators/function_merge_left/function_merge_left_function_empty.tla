(*---
description: function_merge_left applied to function_empty, a FcnRcdValue.
ref: tlc2/module/TLC.java#CombineFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_merge_left_function_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([x \in {} |-> x] @@ (9 :> 9))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (9 :> 9)"
---*)
