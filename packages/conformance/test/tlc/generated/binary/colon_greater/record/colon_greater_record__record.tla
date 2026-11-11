(*---
description: colon_greater of record, a RecordValue, and record, a RecordValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_record__record ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> 1, b |-> 2]) :> ([a |-> 1, b |-> 2]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| ([a |-> 1, b |-> 2] :> [a |-> 1, b |-> 2])"
---*)
