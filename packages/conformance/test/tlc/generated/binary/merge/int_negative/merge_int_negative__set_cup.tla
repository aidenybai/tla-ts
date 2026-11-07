(*---
description: merge of int_negative, a IntValue, and set_cup, a SetCupValue.
ref: tlc2/module/TLC.java#CombineFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE merge_int_negative__set_cup ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-3) @@ ({1} \cup {2}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of @@ should be a function, but instead it is:
    -3
    2169:0 The first argument of @@ should be a function, but instead it is:
    -3
---*)
