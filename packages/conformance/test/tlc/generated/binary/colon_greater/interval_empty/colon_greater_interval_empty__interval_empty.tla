(*---
description: colon_greater of interval_empty, a IntervalValue, and interval_empty, a IntervalValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_interval_empty__interval_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((3..1) :> (3..1))
====

(*--- recorded
all:
  exit: 0
  transcript: "| ({} :> {})"
---*)
