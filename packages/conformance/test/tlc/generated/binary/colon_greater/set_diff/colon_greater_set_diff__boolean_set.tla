(*---
description: colon_greater of set_diff, a SetDiffValue, and boolean_set, a SetEnumValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_set_diff__boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1, 2} \ {2}) :> (BOOLEAN))
====

(*--- recorded
all:
  exit: 0
  transcript: "| ({1} :> {FALSE, TRUE})"
---*)
