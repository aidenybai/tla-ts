(*---
description: append_value applied to interval, a IntervalValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_value_interval ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(<<1>>, 1..3))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, 1..3>>"
---*)
