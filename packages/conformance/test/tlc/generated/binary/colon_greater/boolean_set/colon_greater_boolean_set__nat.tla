(*---
description: colon_greater of boolean_set, a SetEnumValue, and nat, a UserValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_boolean_set__nat ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((BOOLEAN) :> (Nat))
====

(*--- recorded
all:
  exit: 0
  transcript: "| ({FALSE, TRUE} :> Nat)"
---*)
