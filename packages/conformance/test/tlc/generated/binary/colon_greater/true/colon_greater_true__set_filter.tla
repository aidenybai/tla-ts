(*---
description: colon_greater of true, a BoolValue, and set_filter, a SetPredValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_true__set_filter ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((TRUE) :> ({x \in 1..3 : x > 1}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (TRUE :> {2, 3})"
---*)
