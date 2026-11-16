(*---
description: append_value applied to true, a BoolValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_value_true ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(<<1>>, TRUE))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, TRUE>>"
---*)
