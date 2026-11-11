(*---
description: colon_greater of true, a BoolValue, and int_maximum, a IntValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_true__int_maximum ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((TRUE) :> (2147483647))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (TRUE :> 2147483647)"
---*)
