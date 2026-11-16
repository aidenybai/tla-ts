(*---
description: colon_greater of set_nested, a SetEnumValue, and boolean_set, a SetEnumValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_set_nested__boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({{1}, {}}) :> (BOOLEAN))
====

(*--- recorded
all:
  exit: 0
  transcript: "| ({{}, {1}} :> {FALSE, TRUE})"
---*)
