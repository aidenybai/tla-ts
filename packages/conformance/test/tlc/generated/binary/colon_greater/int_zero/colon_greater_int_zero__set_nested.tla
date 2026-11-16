(*---
description: colon_greater of int_zero, a IntValue, and set_nested, a SetEnumValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_int_zero__set_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((0) :> ({{1}, {}}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (0 :> {{}, {1}})"
---*)
