(*---
description: colon_greater of tuple, a TupleValue, and set_empty, a SetEnumValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_tuple__set_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<1, 2>>) :> ({}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (<<1, 2>> :> {})"
---*)
