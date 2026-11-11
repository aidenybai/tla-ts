(*---
description: colon_greater of union, a UnionValue, and union, a UnionValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_union__union ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {{1}, {2}}) :> (UNION {{1}, {2}}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| ({1, 2} :> {1, 2})"
---*)
