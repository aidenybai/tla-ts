(*---
description: append_value applied to set_nested, a SetEnumValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_value_set_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(<<1>>, {{1}, {}}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, {{}, {1}}>>"
---*)
