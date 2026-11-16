(*---
description: append_to applied to bag, a FcnRcdValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_to_bag ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SetToBag({1}), 9))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, 9>>"
---*)
