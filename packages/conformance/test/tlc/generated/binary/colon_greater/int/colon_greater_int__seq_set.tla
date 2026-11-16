(*---
description: colon_greater of int, a UserValue, and seq_set, a UserValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_int__seq_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Int) :> (Seq({1})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (Int :> Seq({1}))"
---*)
