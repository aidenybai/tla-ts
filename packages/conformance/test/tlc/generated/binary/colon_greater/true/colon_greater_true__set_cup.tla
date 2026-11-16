(*---
description: colon_greater of true, a BoolValue, and set_cup, a SetCupValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_true__set_cup ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((TRUE) :> ({1} \cup {2}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (TRUE :> {1, 2})"
---*)
