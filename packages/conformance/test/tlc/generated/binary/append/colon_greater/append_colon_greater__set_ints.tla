(*---
description: append of colon_greater, a FcnRcdValue, and set_ints, a SetEnumValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_colon_greater__set_ints ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(1 :> 2, {2, 1}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2, {1, 2}>>"
---*)
