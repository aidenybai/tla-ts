(*---
description: merge of int, a UserValue, and union, a UnionValue.
ref: tlc2/module/TLC.java#CombineFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE merge_int__union ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Int) @@ (UNION {{1}, {2}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of @@ should be a function, but instead it is:
    Int
    2169:0 The first argument of @@ should be a function, but instead it is:
    Int
---*)
