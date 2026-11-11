(*---
description: merge of model_value, a ModelValue, and int_maximum, a IntValue.
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
---- MODULE merge_model_value__int_maximum ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT((mv) @@ (2147483647))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 18, col 8 to line 18, col 11 of module merge_model_value__int_maximum failed.
    2169:0 The first argument of @@ should be a function, but instead it is:
    mv
---*)
