(*---
description: append_value applied to set_cap, a SetCapValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_value_set_cap ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(<<1>>, {1, 2} \cap {2, 3}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, {2}>>"
---*)
