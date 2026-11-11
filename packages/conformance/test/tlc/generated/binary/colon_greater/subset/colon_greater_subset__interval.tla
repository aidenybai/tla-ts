(*---
description: colon_greater of subset, a SubsetValue, and interval, a IntervalValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_subset__interval ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SUBSET {1, 2}) :> (1..3))
====

(*--- recorded
all:
  exit: 0
  transcript: "| ({{}, {1}, {2}, {1, 2}} :> 1..3)"
---*)
