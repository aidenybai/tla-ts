(*---
description: colon_greater_key applied to seq_set, a UserValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_key_seq_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Seq({1}) :> 1)
====

(*--- recorded
all:
  exit: 0
  transcript: "| (Seq({1}) :> 1)"
---*)
