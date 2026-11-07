(*---
description: colon_greater of boolean_set, a SetEnumValue, and int_maximum, a IntValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_boolean_set__int_maximum ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((BOOLEAN) :> (2147483647))
====

(*--- recorded
all:
  exit: 0
  transcript: "| ({FALSE, TRUE} :> 2147483647)"
---*)
