(*---
description: colon_greater of boolean_set, a SetEnumValue, and interval_empty, a IntervalValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_boolean_set__interval_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((BOOLEAN) :> (3..1))
====

(*--- recorded
all:
  exit: 0
  transcript: "| ({FALSE, TRUE} :> {})"
---*)
