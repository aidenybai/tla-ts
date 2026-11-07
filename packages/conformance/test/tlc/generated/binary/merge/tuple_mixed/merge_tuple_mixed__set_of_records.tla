(*---
description: merge of tuple_mixed, a TupleValue, and set_of_records, a SetOfRcdsValue.
ref: tlc2/module/TLC.java#CombineFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE merge_tuple_mixed__set_of_records ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<1, "a", {TRUE}>>) @@ ([a : {1, 2}]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of @@ should be a function, but instead it is:
    {[a |-> 1], [a |-> 2]}
    2169:0 The second argument of @@ should be a function, but instead it is:
    {[a |-> 1], [a |-> 2]}
---*)
