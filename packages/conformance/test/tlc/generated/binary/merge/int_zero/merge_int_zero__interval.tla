(*---
description: merge of int_zero, a IntValue, and interval, a IntervalValue.
ref: tlc2/module/TLC.java#CombineFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE merge_int_zero__interval ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((0) @@ (1..3))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module merge_int_zero__interval failed.
    2169:0 The first argument of @@ should be a function, but instead it is:
    0
---*)
