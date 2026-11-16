(*---
description: colon_greater of nat, a UserValue, and nat, a UserValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_nat__nat ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Nat) :> (Nat))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (Nat :> Nat)"
---*)
