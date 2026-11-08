(*---
description: cross_left applied to double_at, a FcnRcdValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_left_double_at ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((1 :> 2) @@ (2 :> 3) \X {9})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module cross_left_double_at failed.
    2169:0 The second argument of @@ should be a function, but instead it is:
    ((2 :> 3) \X {9})
---*)
