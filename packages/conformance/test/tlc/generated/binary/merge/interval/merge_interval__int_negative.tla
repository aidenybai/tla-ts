(*---
description: merge of interval, a IntervalValue, and int_negative, a IntValue.
ref: tlc2/module/TLC.java#CombineFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE merge_interval__int_negative ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((1..3) @@ (-3))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of @@ should be a function, but instead it is:
    1..3
    2169:0 The first argument of @@ should be a function, but instead it is:
    1..3
---*)
