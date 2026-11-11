(*---
description: append_value applied to boolean_set, a SetEnumValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_value_boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(<<1>>, BOOLEAN))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, {FALSE, TRUE}>>"
---*)
