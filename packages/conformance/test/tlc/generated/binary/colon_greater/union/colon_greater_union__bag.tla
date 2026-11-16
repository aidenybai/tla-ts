(*---
description: colon_greater of union, a UnionValue, and bag, a FcnRcdValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_union__bag ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {{1}, {2}}) :> (SetToBag({1})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| ({1, 2} :> <<1>>)"
---*)
