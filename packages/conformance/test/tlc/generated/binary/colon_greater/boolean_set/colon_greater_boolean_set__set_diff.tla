(*---
description: colon_greater of boolean_set, a SetEnumValue, and set_diff, a SetDiffValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_boolean_set__set_diff ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((BOOLEAN) :> ({1, 2} \ {2}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| ({FALSE, TRUE} :> {1})"
---*)
