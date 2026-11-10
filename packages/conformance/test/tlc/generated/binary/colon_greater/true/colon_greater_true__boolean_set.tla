(*---
description: colon_greater of true, a BoolValue, and boolean_set, a SetEnumValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_true__boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((TRUE) :> (BOOLEAN))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (TRUE :> {FALSE, TRUE})"
---*)
