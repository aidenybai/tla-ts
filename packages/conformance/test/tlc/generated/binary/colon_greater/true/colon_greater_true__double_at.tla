(*---
description: colon_greater of true, a BoolValue, and double_at, a FcnRcdValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_true__double_at ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((TRUE) :> ((1 :> 2) @@ (2 :> 3)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (TRUE :> <<2, 3>>)"
---*)
