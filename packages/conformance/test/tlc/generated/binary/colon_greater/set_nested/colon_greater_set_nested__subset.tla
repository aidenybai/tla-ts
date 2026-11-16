(*---
description: colon_greater of set_nested, a SetEnumValue, and subset, a SubsetValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_set_nested__subset ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({{1}, {}}) :> (SUBSET {1, 2}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| ({{}, {1}} :> {{}, {1}, {2}, {1, 2}})"
---*)
