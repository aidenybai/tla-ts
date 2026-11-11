(*---
description: merge of colon_greater, a FcnRcdValue, and bag, a FcnRcdValue.
ref: tlc2/module/TLC.java#CombineFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE merge_colon_greater__bag ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((1 :> 2) @@ (SetToBag({1})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2>>"
---*)
