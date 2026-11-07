(*---
description: colon_greater of false, a BoolValue, and seq_set, a UserValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_false__seq_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((FALSE) :> (Seq({1})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (FALSE :> Seq({1}))"
---*)
