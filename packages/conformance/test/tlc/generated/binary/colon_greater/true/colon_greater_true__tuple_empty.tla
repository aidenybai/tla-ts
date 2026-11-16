(*---
description: colon_greater of true, a BoolValue, and tuple_empty, a TupleValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_true__tuple_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((TRUE) :> (<<>>))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (TRUE :> <<>>)"
---*)
