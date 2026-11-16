(*---
description: colon_greater of boolean_set, a SetEnumValue, and boolean_set, a SetEnumValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_boolean_set__boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((BOOLEAN) :> (BOOLEAN))
====

(*--- recorded
all:
  exit: 0
  transcript: "| ({FALSE, TRUE} :> {FALSE, TRUE})"
---*)
