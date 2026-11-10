(*---
description: colon_greater of int_zero, a IntValue, and boolean_set, a SetEnumValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_int_zero__boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((0) :> (BOOLEAN))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (0 :> {FALSE, TRUE})"
---*)
