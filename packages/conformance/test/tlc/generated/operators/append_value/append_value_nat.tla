(*---
description: append_value applied to nat, a UserValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_value_nat ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(<<1>>, Nat))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, Nat>>"
---*)
