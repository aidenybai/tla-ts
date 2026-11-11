(*---
description: colon_greater of interval_empty, a IntervalValue, and set_of_functions, a SetOfFcnsValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_interval_empty__set_of_functions ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((3..1) :> ([{1} -> {2, 3}]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| ({} :> {<<2>>, <<3>>})"
---*)
