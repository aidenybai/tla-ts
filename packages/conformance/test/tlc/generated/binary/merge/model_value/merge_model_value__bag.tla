(*---
description: merge of model_value, a ModelValue, and bag, a FcnRcdValue.
ref: tlc2/module/TLC.java#CombineFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
config: |
  CONSTANT mv = mv
---*)
---- MODULE merge_model_value__bag ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT((mv) @@ (SetToBag({1})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 18, col 8 to line 18, col 11 of module merge_model_value__bag failed.
    2169:0 The first argument of @@ should be a function, but instead it is:
    mv
---*)
