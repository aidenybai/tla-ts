(*---
description: colon_greater of false, a BoolValue, and int, a UserValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_false__int ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((FALSE) :> (Int))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (FALSE :> Int)"
---*)
