(*---
description: merge of nat, a UserValue, and interval, a IntervalValue.
ref: tlc2/module/TLC.java#CombineFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE merge_nat__interval ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Nat) @@ (1..3))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of @@ should be a function, but instead it is:
    Nat
    2169:0 The first argument of @@ should be a function, but instead it is:
    Nat
---*)
