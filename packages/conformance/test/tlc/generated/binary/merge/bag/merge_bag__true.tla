(*---
description: merge of bag, a FcnRcdValue, and true, a BoolValue.
ref: tlc2/module/TLC.java#CombineFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE merge_bag__true ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SetToBag({1})) @@ (TRUE))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module merge_bag__true failed.
    2169:0 The second argument of @@ should be a function, but instead it is:
    TRUE
---*)
