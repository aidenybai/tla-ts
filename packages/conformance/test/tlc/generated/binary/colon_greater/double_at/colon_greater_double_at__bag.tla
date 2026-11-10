(*---
description: colon_greater of double_at, a FcnRcdValue, and bag, a FcnRcdValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_double_at__bag ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((1 :> 2) @@ (2 :> 3)) :> (SetToBag({1})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (<<2, 3>> :> <<1>>)"
---*)
