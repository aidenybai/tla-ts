(*---
description: colon_greater of subset, a SubsetValue, and nat, a UserValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_subset__nat ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SUBSET {1, 2}) :> (Nat))
====

(*--- recorded
all:
  exit: 0
  transcript: "| ({{}, {1}, {2}, {1, 2}} :> Nat)"
---*)
