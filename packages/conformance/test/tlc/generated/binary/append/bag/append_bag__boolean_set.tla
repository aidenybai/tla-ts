(*---
description: append of bag, a FcnRcdValue, and boolean_set, a SetEnumValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_bag__boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SetToBag({1}), BOOLEAN))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, {FALSE, TRUE}>>"
---*)
