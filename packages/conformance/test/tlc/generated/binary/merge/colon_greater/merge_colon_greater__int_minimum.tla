(*---
description: merge of colon_greater, a FcnRcdValue, and int_minimum, a IntValue.
ref: tlc2/module/TLC.java#CombineFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE merge_colon_greater__int_minimum ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((1 :> 2) @@ ((-2147483647 - 1)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of @@ should be a function, but instead it is:
    -2147483648
    2169:0 The second argument of @@ should be a function, but instead it is:
    -2147483648
---*)
