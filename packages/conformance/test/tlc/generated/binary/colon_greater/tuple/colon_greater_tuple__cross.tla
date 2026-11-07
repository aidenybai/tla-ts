(*---
description: colon_greater of tuple, a TupleValue, and cross, a SetOfTuplesValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_tuple__cross ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<1, 2>>) :> ({1, 2} \X {3}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (<<1, 2>> :> {<<1, 3>>, <<2, 3>>})"
---*)
