(*---
description: colon_greater of set_ints, a SetEnumValue, and tuple_empty, a TupleValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_set_ints__tuple_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({2, 1}) :> (<<>>))
====

(*--- recorded
all:
  exit: 0
  transcript: "| ({1, 2} :> <<>>)"
---*)
