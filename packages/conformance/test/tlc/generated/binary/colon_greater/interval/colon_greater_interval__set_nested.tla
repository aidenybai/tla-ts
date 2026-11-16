(*---
description: colon_greater of interval, a IntervalValue, and set_nested, a SetEnumValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_interval__set_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((1..3) :> ({{1}, {}}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (1..3 :> {{}, {1}})"
---*)
