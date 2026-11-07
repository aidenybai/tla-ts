(*---
description: merge of int, a UserValue, and record, a RecordValue.
ref: tlc2/module/TLC.java#CombineFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE merge_int__record ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Int) @@ ([a |-> 1, b |-> 2]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of @@ should be a function, but instead it is:
    Int
    2169:0 The first argument of @@ should be a function, but instead it is:
    Int
---*)
