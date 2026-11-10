(*---
description: colon_greater of nat, a UserValue, and set_of_functions, a SetOfFcnsValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_nat__set_of_functions ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Nat) :> ([{1} -> {2, 3}]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (Nat :> {<<2>>, <<3>>})"
---*)
