(*---
description: colon_greater of set_empty, a SetEnumValue, and true, a BoolValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_set_empty__true ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) :> (TRUE))
====

(*--- recorded
all:
  exit: 0
  transcript: "| ({} :> TRUE)"
---*)
