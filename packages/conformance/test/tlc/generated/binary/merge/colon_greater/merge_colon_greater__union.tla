(*---
description: merge of colon_greater, a FcnRcdValue, and union, a UnionValue.
ref: tlc2/module/TLC.java#CombineFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE merge_colon_greater__union ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((1 :> 2) @@ (UNION {{1}, {2}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of @@ should be a function, but instead it is:
    {1, 2}
    2169:0 The second argument of @@ should be a function, but instead it is:
    {1, 2}
---*)
