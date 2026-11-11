(*---
description: colon_greater_key applied to int_zero, a IntValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_key_int_zero ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(0 :> 1)
====

(*--- recorded
all:
  exit: 0
  transcript: "| (0 :> 1)"
---*)
