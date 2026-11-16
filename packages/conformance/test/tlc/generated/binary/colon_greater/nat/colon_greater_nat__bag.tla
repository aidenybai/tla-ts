(*---
description: colon_greater of nat, a UserValue, and bag, a FcnRcdValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_nat__bag ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Nat) :> (SetToBag({1})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (Nat :> <<1>>)"
---*)
