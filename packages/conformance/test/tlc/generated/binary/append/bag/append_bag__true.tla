(*---
description: append of bag, a FcnRcdValue, and true, a BoolValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_bag__true ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SetToBag({1}), TRUE))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, TRUE>>"
---*)
