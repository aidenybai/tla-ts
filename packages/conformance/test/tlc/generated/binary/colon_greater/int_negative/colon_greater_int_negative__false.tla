(*---
description: colon_greater of int_negative, a IntValue, and false, a BoolValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_int_negative__false ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-3) :> (FALSE))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (-3 :> FALSE)"
---*)
