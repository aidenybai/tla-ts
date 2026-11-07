(*---
description: colon_greater of union, a UnionValue, and int_zero, a IntValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_union__int_zero ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {{1}, {2}}) :> (0))
====

(*--- recorded
all:
  exit: 0
  transcript: "| ({1, 2} :> 0)"
---*)
