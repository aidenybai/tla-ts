(*---
description: merge of set_cap, a SetCapValue, and model_value, a ModelValue.
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
---- MODULE merge_set_cap__model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT(({1, 2} \cap {2, 3}) @@ (mv))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of @@ should be a function, but instead it is:
    {2}
    2169:0 The first argument of @@ should be a function, but instead it is:
    {2}
---*)
