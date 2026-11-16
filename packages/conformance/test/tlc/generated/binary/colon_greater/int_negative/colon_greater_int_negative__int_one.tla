(*---
description: colon_greater of int_negative, a IntValue, and int_one, a IntValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_int_negative__int_one ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-3) :> (1))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (-3 :> 1)"
---*)
