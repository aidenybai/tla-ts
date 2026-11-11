(*---
description: colon_greater of tuple_empty, a TupleValue, and int_one, a IntValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_tuple_empty__int_one ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<>>) :> (1))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (<<>> :> 1)"
---*)
