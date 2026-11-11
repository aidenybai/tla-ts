(*---
description: colon_greater of nat, a UserValue, and int_one, a IntValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_nat__int_one ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Nat) :> (1))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (Nat :> 1)"
---*)
