(*---
description: colon_greater of int_one, a IntValue, and bag, a FcnRcdValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_int_one__bag ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((1) :> (SetToBag({1})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<<<1>>>>"
---*)
