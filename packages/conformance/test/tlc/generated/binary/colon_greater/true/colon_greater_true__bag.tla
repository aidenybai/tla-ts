(*---
description: colon_greater of true, a BoolValue, and bag, a FcnRcdValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_true__bag ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((TRUE) :> (SetToBag({1})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (TRUE :> <<1>>)"
---*)
