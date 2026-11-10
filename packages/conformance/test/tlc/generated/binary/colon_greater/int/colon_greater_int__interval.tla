(*---
description: colon_greater of int, a UserValue, and interval, a IntervalValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_int__interval ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Int) :> (1..3))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (Int :> 1..3)"
---*)
