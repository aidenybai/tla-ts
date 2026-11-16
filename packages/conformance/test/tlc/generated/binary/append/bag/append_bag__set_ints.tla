(*---
description: append of bag, a FcnRcdValue, and set_ints, a SetEnumValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_bag__set_ints ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SetToBag({1}), {2, 1}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, {1, 2}>>"
---*)
