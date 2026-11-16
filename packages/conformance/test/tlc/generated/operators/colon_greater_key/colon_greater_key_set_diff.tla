(*---
description: colon_greater_key applied to set_diff, a SetDiffValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_key_set_diff ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({1, 2} \ {2} :> 1)
====

(*--- recorded
all:
  exit: 0
  transcript: "| ({1} :> 1)"
---*)
