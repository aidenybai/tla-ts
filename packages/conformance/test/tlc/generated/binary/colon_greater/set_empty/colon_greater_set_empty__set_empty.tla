(*---
description: colon_greater of set_empty, a SetEnumValue, and set_empty, a SetEnumValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_set_empty__set_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) :> ({}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| ({} :> {})"
---*)
