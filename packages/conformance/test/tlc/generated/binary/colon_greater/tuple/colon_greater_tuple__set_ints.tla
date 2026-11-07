(*---
description: colon_greater of tuple, a TupleValue, and set_ints, a SetEnumValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_tuple__set_ints ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<1, 2>>) :> ({2, 1}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (<<1, 2>> :> {1, 2})"
---*)
