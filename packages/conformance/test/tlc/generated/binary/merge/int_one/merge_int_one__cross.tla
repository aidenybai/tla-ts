(*---
description: merge of int_one, a IntValue, and cross, a SetOfTuplesValue.
ref: tlc2/module/TLC.java#CombineFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE merge_int_one__cross ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((1) @@ ({1, 2} \X {3}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module merge_int_one__cross failed.
    2169:0 The first argument of @@ should be a function, but instead it is:
    1
---*)
