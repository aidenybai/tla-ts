(*---
description: merge of function, a FcnRcdValue, and set_of_records, a SetOfRcdsValue.
ref: tlc2/module/TLC.java#CombineFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE merge_function__set_of_records ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in {1, 2} |-> x * 2]) @@ ([a : {1, 2}]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module merge_function__set_of_records failed.
    2169:0 The second argument of @@ should be a function, but instead it is:
    {[a |-> 1], [a |-> 2]}
---*)
