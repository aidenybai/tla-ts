(*---
description: colon_greater of false, a BoolValue, and set_diff, a SetDiffValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_false__set_diff ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((FALSE) :> ({1, 2} \ {2}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (FALSE :> {1})"
---*)
