(*---
description: colon_greater of set_of_records, a SetOfRcdsValue, and int_zero, a IntValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_set_of_records__int_zero ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a : {1, 2}]) :> (0))
====

(*--- recorded
all:
  exit: 0
  transcript: "| ({[a |-> 1], [a |-> 2]} :> 0)"
---*)
