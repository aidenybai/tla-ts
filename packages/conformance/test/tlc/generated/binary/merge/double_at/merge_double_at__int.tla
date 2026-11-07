(*---
description: merge of double_at, a FcnRcdValue, and int, a UserValue.
ref: tlc2/module/TLC.java#CombineFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE merge_double_at__int ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((1 :> 2) @@ (2 :> 3)) @@ (Int))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of @@ should be a function, but instead it is:
    Int
    2169:0 The second argument of @@ should be a function, but instead it is:
    Int
---*)
