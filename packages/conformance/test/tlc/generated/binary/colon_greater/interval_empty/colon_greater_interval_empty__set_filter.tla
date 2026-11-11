(*---
description: colon_greater of interval_empty, a IntervalValue, and set_filter, a SetPredValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_interval_empty__set_filter ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((3..1) :> ({x \in 1..3 : x > 1}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| ({} :> {2, 3})"
---*)
