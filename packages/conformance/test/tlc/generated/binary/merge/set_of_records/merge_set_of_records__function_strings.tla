(*---
description: merge of set_of_records, a SetOfRcdsValue, and function_strings, a FcnRcdValue.
ref: tlc2/module/TLC.java#CombineFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE merge_set_of_records__function_strings ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a : {1, 2}]) @@ ([x \in {"a", "b"} |-> x]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of @@ should be a function, but instead it is:
    {[a |-> 1], [a |-> 2]}
    2169:0 The first argument of @@ should be a function, but instead it is:
    {[a |-> 1], [a |-> 2]}
---*)
