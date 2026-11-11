(*---
description: colon_greater of false, a BoolValue, and set_nested, a SetEnumValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_false__set_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((FALSE) :> ({{1}, {}}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (FALSE :> {{}, {1}})"
---*)
