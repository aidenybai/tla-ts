(*---
description: colon_greater_key applied to false, a BoolValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_key_false ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(FALSE :> 1)
====

(*--- recorded
all:
  exit: 0
  transcript: "| (FALSE :> 1)"
---*)
