(*---
description: merge of false, a BoolValue, and set_of_records, a SetOfRcdsValue.
ref: tlc2/module/TLC.java#CombineFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE merge_false__set_of_records ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((FALSE) @@ ([a : {1, 2}]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of @@ should be a function, but instead it is:
    FALSE
    2169:0 The first argument of @@ should be a function, but instead it is:
    FALSE
---*)
