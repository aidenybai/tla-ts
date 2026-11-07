(*---
description: colon_greater of nat, a UserValue, and int, a UserValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_nat__int ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Nat) :> (Int))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (Nat :> Int)"
---*)
