(*---
description: colon_greater of boolean_set, a SetEnumValue, and subset, a SubsetValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_boolean_set__subset ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((BOOLEAN) :> (SUBSET {1, 2}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| ({FALSE, TRUE} :> {{}, {1}, {2}, {1, 2}})"
---*)
