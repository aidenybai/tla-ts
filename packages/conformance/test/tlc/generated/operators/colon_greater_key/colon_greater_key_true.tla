(*---
description: colon_greater_key applied to true, a BoolValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_key_true ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(TRUE :> 1)
====

(*--- recorded
all:
  exit: 0
  transcript: "| (TRUE :> 1)"
---*)
