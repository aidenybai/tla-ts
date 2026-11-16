(*---
description: colon_greater of nat, a UserValue, and interval, a IntervalValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_nat__interval ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Nat) :> (1..3))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (Nat :> 1..3)"
---*)
