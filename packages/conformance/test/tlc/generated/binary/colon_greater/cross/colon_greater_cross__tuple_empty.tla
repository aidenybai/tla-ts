(*---
description: colon_greater of cross, a SetOfTuplesValue, and tuple_empty, a TupleValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_cross__tuple_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1, 2} \X {3}) :> (<<>>))
====

(*--- recorded
all:
  exit: 0
  transcript: "| ({<<1, 3>>, <<2, 3>>} :> <<>>)"
---*)
