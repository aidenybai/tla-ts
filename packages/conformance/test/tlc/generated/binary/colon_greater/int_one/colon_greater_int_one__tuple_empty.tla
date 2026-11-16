(*---
description: colon_greater of int_one, a IntValue, and tuple_empty, a TupleValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_int_one__tuple_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((1) :> (<<>>))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<<<>>>>"
---*)
