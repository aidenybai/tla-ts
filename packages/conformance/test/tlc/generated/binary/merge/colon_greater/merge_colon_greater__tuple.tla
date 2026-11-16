(*---
description: merge of colon_greater, a FcnRcdValue, and tuple, a TupleValue.
ref: tlc2/module/TLC.java#CombineFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE merge_colon_greater__tuple ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((1 :> 2) @@ (<<1, 2>>))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2, 2>>"
---*)
