(*---
description: colon_greater of int_zero, a IntValue, and int_minimum, a IntValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_int_zero__int_minimum ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((0) :> ((-2147483647 - 1)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (0 :> -2147483648)"
---*)
