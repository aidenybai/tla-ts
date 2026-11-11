(*---
description: colon_greater of set_empty, a SetEnumValue, and tuple_mixed, a TupleValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_set_empty__tuple_mixed ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) :> (<<1, "a", {TRUE}>>))
====

(*--- recorded
all:
  exit: 0
  transcript: '| ({} :> <<1, "a", {TRUE}>>)'
---*)
