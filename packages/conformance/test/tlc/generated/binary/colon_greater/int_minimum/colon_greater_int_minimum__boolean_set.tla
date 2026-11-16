(*---
description: colon_greater of int_minimum, a IntValue, and boolean_set, a SetEnumValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_int_minimum__boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-2147483647 - 1)) :> (BOOLEAN))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (-2147483648 :> {FALSE, TRUE})"
---*)
