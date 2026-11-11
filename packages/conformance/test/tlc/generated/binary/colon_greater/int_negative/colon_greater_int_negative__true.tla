(*---
description: colon_greater of int_negative, a IntValue, and true, a BoolValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_int_negative__true ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-3) :> (TRUE))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (-3 :> TRUE)"
---*)
