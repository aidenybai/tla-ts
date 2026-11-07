(*---
description: colon_greater of interval, a IntervalValue, and int_maximum, a IntValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_interval__int_maximum ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((1..3) :> (2147483647))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (1..3 :> 2147483647)"
---*)
