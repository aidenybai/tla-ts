(*---
description: colon_greater of int_zero, a IntValue, and record, a RecordValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_int_zero__record ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((0) :> ([a |-> 1, b |-> 2]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (0 :> [a |-> 1, b |-> 2])"
---*)
