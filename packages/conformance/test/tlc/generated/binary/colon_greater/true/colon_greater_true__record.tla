(*---
description: colon_greater of true, a BoolValue, and record, a RecordValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_true__record ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((TRUE) :> ([a |-> 1, b |-> 2]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (TRUE :> [a |-> 1, b |-> 2])"
---*)
