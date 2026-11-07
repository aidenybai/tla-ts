(*---
description: append_value applied to set_map, a SetEnumValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_value_set_map ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(<<1>>, {x + 1 : x \in 1..2}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, {2, 3}>>"
---*)
