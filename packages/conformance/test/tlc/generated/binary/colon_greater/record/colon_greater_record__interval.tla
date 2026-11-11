(*---
description: colon_greater of record, a RecordValue, and interval, a IntervalValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_record__interval ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> 1, b |-> 2]) :> (1..3))
====

(*--- recorded
all:
  exit: 0
  transcript: "| ([a |-> 1, b |-> 2] :> 1..3)"
---*)
