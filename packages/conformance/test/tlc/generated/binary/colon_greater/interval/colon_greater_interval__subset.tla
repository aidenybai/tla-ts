(*---
description: colon_greater of interval, a IntervalValue, and subset, a SubsetValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_interval__subset ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((1..3) :> (SUBSET {1, 2}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (1..3 :> {{}, {1}, {2}, {1, 2}})"
---*)
