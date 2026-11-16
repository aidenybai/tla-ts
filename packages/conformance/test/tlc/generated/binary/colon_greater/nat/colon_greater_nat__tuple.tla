(*---
description: colon_greater of nat, a UserValue, and tuple, a TupleValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_nat__tuple ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Nat) :> (<<1, 2>>))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (Nat :> <<1, 2>>)"
---*)
