(*---
description: colon_greater of tuple_mixed, a TupleValue, and set_cup, a SetCupValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_tuple_mixed__set_cup ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<1, "a", {TRUE}>>) :> ({1} \cup {2}))
====

(*--- recorded
all:
  exit: 0
  transcript: '| (<<1, "a", {TRUE}>> :> {1, 2})'
---*)
