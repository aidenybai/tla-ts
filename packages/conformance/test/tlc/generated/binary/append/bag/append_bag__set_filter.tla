(*---
description: append of bag, a FcnRcdValue, and set_filter, a SetPredValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_bag__set_filter ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SetToBag({1}), {x \in 1..3 : x > 1}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, {2, 3}>>"
---*)
