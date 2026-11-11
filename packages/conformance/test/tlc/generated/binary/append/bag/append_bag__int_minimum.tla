(*---
description: append of bag, a FcnRcdValue, and int_minimum, a IntValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_bag__int_minimum ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SetToBag({1}), (-2147483647 - 1)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, -2147483648>>"
---*)
