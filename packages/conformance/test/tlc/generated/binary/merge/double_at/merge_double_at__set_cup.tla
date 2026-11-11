(*---
description: merge of double_at, a FcnRcdValue, and set_cup, a SetCupValue.
ref: tlc2/module/TLC.java#CombineFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE merge_double_at__set_cup ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((1 :> 2) @@ (2 :> 3)) @@ ({1} \cup {2}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module merge_double_at__set_cup failed.
    2169:0 The second argument of @@ should be a function, but instead it is:
    {1, 2}
---*)
