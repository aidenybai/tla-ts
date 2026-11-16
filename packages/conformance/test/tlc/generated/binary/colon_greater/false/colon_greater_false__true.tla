(*---
description: colon_greater of false, a BoolValue, and true, a BoolValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_false__true ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((FALSE) :> (TRUE))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (FALSE :> TRUE)"
---*)
