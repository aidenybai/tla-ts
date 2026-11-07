(*---
description: colon_greater of colon_greater, a FcnRcdValue, and tuple_empty, a TupleValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_colon_greater__tuple_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((1 :> 2) :> (<<>>))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (<<2>> :> <<>>)"
---*)
