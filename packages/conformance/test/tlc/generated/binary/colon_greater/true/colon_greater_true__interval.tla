(*---
description: colon_greater of true, a BoolValue, and interval, a IntervalValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_true__interval ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((TRUE) :> (1..3))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (TRUE :> 1..3)"
---*)
