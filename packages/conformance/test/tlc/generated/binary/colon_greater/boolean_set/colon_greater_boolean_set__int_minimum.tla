(*---
description: colon_greater of boolean_set, a SetEnumValue, and int_minimum, a IntValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_boolean_set__int_minimum ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((BOOLEAN) :> ((-2147483647 - 1)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| ({FALSE, TRUE} :> -2147483648)"
---*)
