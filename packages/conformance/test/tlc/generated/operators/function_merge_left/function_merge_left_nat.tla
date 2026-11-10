(*---
description: function_merge_left applied to nat, a UserValue.
ref: tlc2/module/TLC.java#CombineFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_merge_left_nat ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Nat @@ (9 :> 9))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module function_merge_left_nat failed.
    2169:0 The first argument of @@ should be a function, but instead it is:
    Nat
---*)
