(*---
description: append_value applied to set_empty, a SetEnumValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_value_set_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(<<1>>, {}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, {}>>"
---*)
