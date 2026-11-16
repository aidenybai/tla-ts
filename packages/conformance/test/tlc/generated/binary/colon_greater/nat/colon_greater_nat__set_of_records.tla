(*---
description: colon_greater of nat, a UserValue, and set_of_records, a SetOfRcdsValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_nat__set_of_records ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Nat) :> ([a : {1, 2}]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (Nat :> {[a |-> 1], [a |-> 2]})"
---*)
