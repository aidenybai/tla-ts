(*---
description: colon_greater of seq_set, a UserValue, and true, a BoolValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_seq_set__true ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Seq({1})) :> (TRUE))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (Seq({1}) :> TRUE)"
---*)
