(*---
description: colon_greater of int, a UserValue, and boolean_set, a SetEnumValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_int__boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Int) :> (BOOLEAN))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (Int :> {FALSE, TRUE})"
---*)
