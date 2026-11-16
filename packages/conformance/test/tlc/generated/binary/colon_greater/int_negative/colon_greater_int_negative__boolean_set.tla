(*---
description: colon_greater of int_negative, a IntValue, and boolean_set, a SetEnumValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_int_negative__boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-3) :> (BOOLEAN))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (-3 :> {FALSE, TRUE})"
---*)
