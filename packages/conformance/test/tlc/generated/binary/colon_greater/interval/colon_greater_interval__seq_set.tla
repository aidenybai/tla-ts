(*---
description: colon_greater of interval, a IntervalValue, and seq_set, a UserValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_interval__seq_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((1..3) :> (Seq({1})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (1..3 :> Seq({1}))"
---*)
