(*---
description: append_value applied to set_of_functions, a SetOfFcnsValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_value_set_of_functions ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(<<1>>, [{1} -> {2, 3}]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, {<<2>>, <<3>>}>>"
---*)
