(*---
description: colon_greater of false, a BoolValue, and record_nested, a RecordValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_false__record_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((FALSE) :> ([a |-> [b |-> <<1>>]]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (FALSE :> [a |-> [b |-> <<1>>]])"
---*)
