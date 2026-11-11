(*---
description: colon_greater of set_empty, a SetEnumValue, and int, a UserValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_set_empty__int ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) :> (Int))
====

(*--- recorded
all:
  exit: 0
  transcript: "| ({} :> Int)"
---*)
