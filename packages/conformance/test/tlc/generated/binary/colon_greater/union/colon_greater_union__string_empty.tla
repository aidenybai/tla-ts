(*---
description: colon_greater of union, a UnionValue, and string_empty, a StringValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_union__string_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {{1}, {2}}) :> (""))
====

(*--- recorded
all:
  exit: 0
  transcript: '| ({1, 2} :> "")'
---*)
