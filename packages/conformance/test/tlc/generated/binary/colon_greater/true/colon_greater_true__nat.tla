(*---
description: colon_greater of true, a BoolValue, and nat, a UserValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_true__nat ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((TRUE) :> (Nat))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (TRUE :> Nat)"
---*)
