(*---
description: colon_greater of nat, a UserValue, and true, a BoolValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_nat__true ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Nat) :> (TRUE))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (Nat :> TRUE)"
---*)
