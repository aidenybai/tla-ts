(*---
description: colon_greater of nat, a UserValue, and string_a, a StringValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_nat__string_a ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Nat) :> ("a"))
====

(*--- recorded
all:
  exit: 0
  transcript: '| (Nat :> "a")'
---*)
