(*---
description: append of bag, a FcnRcdValue, and bag, a FcnRcdValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_bag__bag ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SetToBag({1}), SetToBag({1})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, <<1>>>>"
---*)
