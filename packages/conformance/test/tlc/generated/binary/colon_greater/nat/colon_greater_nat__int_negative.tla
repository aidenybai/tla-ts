(*---
description: colon_greater of nat, a UserValue, and int_negative, a IntValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_nat__int_negative ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Nat) :> (-3))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (Nat :> -3)"
---*)
