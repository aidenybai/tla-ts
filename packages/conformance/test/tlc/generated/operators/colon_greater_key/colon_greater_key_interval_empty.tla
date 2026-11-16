(*---
description: colon_greater_key applied to interval_empty, a IntervalValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_key_interval_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(3..1 :> 1)
====

(*--- recorded
all:
  exit: 0
  transcript: "| ({} :> 1)"
---*)
