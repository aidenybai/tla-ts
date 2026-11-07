(*---
description: merge of int_minimum, a IntValue, and cross, a SetOfTuplesValue.
ref: tlc2/module/TLC.java#CombineFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE merge_int_minimum__cross ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-2147483647 - 1)) @@ ({1, 2} \X {3}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of @@ should be a function, but instead it is:
    -2147483648
    2169:0 The first argument of @@ should be a function, but instead it is:
    -2147483648
---*)
