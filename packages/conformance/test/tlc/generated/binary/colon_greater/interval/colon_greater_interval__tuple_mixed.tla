(*---
description: colon_greater of interval, a IntervalValue, and tuple_mixed, a TupleValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_interval__tuple_mixed ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((1..3) :> (<<1, "a", {TRUE}>>))
====

(*--- recorded
all:
  exit: 0
  transcript: '| (1..3 :> <<1, "a", {TRUE}>>)'
---*)
