(*---
description: merge of int_maximum, a IntValue, and seq_set, a UserValue.
ref: tlc2/module/TLC.java#CombineFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE merge_int_maximum__seq_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((2147483647) @@ (Seq({1})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of @@ should be a function, but instead it is:
    2147483647
    2169:0 The first argument of @@ should be a function, but instead it is:
    2147483647
---*)
