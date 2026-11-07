(*---
description: merge of set_nested, a SetEnumValue, and function_empty, a FcnRcdValue.
ref: tlc2/module/TLC.java#CombineFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE merge_set_nested__function_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({{1}, {}}) @@ ([x \in {} |-> x]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of @@ should be a function, but instead it is:
    {{}, {1}}
    2169:0 The first argument of @@ should be a function, but instead it is:
    {{}, {1}}
---*)
