(*---
description: colon_greater of false, a BoolValue, and int_maximum, a IntValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_false__int_maximum ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((FALSE) :> (2147483647))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (FALSE :> 2147483647)"
---*)
