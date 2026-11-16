(*---
description: colon_greater of double_at, a FcnRcdValue, and set_nested, a SetEnumValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_double_at__set_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((1 :> 2) @@ (2 :> 3)) :> ({{1}, {}}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (<<2, 3>> :> {{}, {1}})"
---*)
