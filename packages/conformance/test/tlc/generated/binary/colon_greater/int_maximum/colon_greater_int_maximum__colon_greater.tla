(*---
description: colon_greater of int_maximum, a IntValue, and colon_greater, a FcnRcdValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_int_maximum__colon_greater ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((2147483647) :> (1 :> 2))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (2147483647 :> <<2>>)"
---*)
