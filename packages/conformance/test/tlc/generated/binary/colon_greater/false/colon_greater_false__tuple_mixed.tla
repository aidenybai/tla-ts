(*---
description: colon_greater of false, a BoolValue, and tuple_mixed, a TupleValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_false__tuple_mixed ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((FALSE) :> (<<1, "a", {TRUE}>>))
====

(*--- recorded
all:
  exit: 0
  transcript: '| (FALSE :> <<1, "a", {TRUE}>>)'
---*)
