(*---
description: colon_greater of int_zero, a IntValue, and tuple, a TupleValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_int_zero__tuple ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((0) :> (<<1, 2>>))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (0 :> <<1, 2>>)"
---*)
