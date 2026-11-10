(*---
description: colon_greater_key applied to nat, a UserValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_key_nat ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Nat :> 1)
====

(*--- recorded
all:
  exit: 0
  transcript: "| (Nat :> 1)"
---*)
