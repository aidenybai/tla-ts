(*---
description: colon_greater of tuple_empty, a TupleValue, and tuple_empty, a TupleValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_tuple_empty__tuple_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<>>) :> (<<>>))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (<<>> :> <<>>)"
---*)
