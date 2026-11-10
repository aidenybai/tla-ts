(*---
description: colon_greater of true, a BoolValue, and int_negative, a IntValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_true__int_negative ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((TRUE) :> (-3))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (TRUE :> -3)"
---*)
