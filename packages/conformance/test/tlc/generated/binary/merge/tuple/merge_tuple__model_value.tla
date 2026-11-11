(*---
description: merge of tuple, a TupleValue, and model_value, a ModelValue.
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
---- MODULE merge_tuple__model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT((<<1, 2>>) @@ (mv))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 18, col 8 to line 18, col 11 of module merge_tuple__model_value failed.
    2169:0 The second argument of @@ should be a function, but instead it is:
    mv
---*)
