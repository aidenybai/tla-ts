(*---
description: colon_greater of true, a BoolValue, and set_ints, a SetEnumValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_true__set_ints ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((TRUE) :> ({2, 1}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (TRUE :> {1, 2})"
---*)
