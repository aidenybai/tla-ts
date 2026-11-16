(*---
description: colon_greater of nat, a UserValue, and string_set, a UserValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_nat__string_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Nat) :> (STRING))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (Nat :> STRING)"
---*)
