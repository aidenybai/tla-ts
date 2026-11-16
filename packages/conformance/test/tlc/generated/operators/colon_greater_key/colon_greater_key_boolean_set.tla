(*---
description: colon_greater_key applied to boolean_set, a SetEnumValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_key_boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(BOOLEAN :> 1)
====

(*--- recorded
all:
  exit: 0
  transcript: "| ({FALSE, TRUE} :> 1)"
---*)
