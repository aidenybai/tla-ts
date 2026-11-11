(*---
description: append_value applied to int_maximum, a IntValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_value_int_maximum ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(<<1>>, 2147483647))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, 2147483647>>"
---*)
