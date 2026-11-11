(*---
description: colon_greater of int, a UserValue, and nat, a UserValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_int__nat ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Int) :> (Nat))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (Int :> Nat)"
---*)
