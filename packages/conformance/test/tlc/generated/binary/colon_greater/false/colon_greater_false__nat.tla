(*---
description: colon_greater of false, a BoolValue, and nat, a UserValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_false__nat ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((FALSE) :> (Nat))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (FALSE :> Nat)"
---*)
