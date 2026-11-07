(*---
description: merge of function_pair_domain, a FcnRcdValue, and subset, a SubsetValue.
ref: tlc2/module/TLC.java#CombineFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE merge_function_pair_domain__subset ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in {1}, y \in {2} |-> x + y]) @@ (SUBSET {1, 2}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of @@ should be a function, but instead it is:
    {{}, {1}, {2}, {1, 2}}
    2169:0 The second argument of @@ should be a function, but instead it is:
    {{}, {1}, {2}, {1, 2}}
---*)
