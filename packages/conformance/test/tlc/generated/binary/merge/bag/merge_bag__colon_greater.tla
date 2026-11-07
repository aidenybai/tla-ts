(*---
description: merge of bag, a FcnRcdValue, and colon_greater, a FcnRcdValue.
ref: tlc2/module/TLC.java#CombineFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE merge_bag__colon_greater ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SetToBag({1})) @@ (1 :> 2))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1>>"
---*)
