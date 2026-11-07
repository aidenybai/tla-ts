(*---
description: merge of function_empty, a FcnRcdValue, and set_of_records, a SetOfRcdsValue.
ref: tlc2/module/TLC.java#CombineFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE merge_function_empty__set_of_records ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in {} |-> x]) @@ ([a : {1, 2}]))
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
