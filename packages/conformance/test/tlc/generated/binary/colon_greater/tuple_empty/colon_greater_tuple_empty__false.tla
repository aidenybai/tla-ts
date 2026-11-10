(*---
description: colon_greater of tuple_empty, a TupleValue, and false, a BoolValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_tuple_empty__false ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<>>) :> (FALSE))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (<<>> :> FALSE)"
---*)
