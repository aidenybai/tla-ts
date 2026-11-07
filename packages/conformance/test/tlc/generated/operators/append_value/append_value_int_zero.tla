(*---
description: append_value applied to int_zero, a IntValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_value_int_zero ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(<<1>>, 0))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, 0>>"
---*)
