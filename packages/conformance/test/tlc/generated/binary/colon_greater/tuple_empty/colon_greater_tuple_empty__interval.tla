(*---
description: colon_greater of tuple_empty, a TupleValue, and interval, a IntervalValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_tuple_empty__interval ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<>>) :> (1..3))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (<<>> :> 1..3)"
---*)
