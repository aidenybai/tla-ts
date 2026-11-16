(*---
description: colon_greater of union, a UnionValue, and boolean_set, a SetEnumValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_union__boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {{1}, {2}}) :> (BOOLEAN))
====

(*--- recorded
all:
  exit: 0
  transcript: "| ({1, 2} :> {FALSE, TRUE})"
---*)
