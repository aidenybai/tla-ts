(*---
description: colon_greater of set_empty, a SetEnumValue, and boolean_set, a SetEnumValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_set_empty__boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) :> (BOOLEAN))
====

(*--- recorded
all:
  exit: 0
  transcript: "| ({} :> {FALSE, TRUE})"
---*)
