(*---
description: append of bag, a FcnRcdValue, and interval_empty, a IntervalValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_bag__interval_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SetToBag({1}), 3..1))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, {}>>"
---*)
