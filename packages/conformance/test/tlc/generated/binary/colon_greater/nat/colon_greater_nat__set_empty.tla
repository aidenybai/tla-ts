(*---
description: colon_greater of nat, a UserValue, and set_empty, a SetEnumValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_nat__set_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Nat) :> ({}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (Nat :> {})"
---*)
