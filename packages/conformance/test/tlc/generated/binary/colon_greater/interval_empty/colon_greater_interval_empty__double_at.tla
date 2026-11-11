(*---
description: colon_greater of interval_empty, a IntervalValue, and double_at, a FcnRcdValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_interval_empty__double_at ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((3..1) :> ((1 :> 2) @@ (2 :> 3)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| ({} :> <<2, 3>>)"
---*)
