(*---
description: colon_greater of tuple_mixed, a TupleValue, and string_set, a UserValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_tuple_mixed__string_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<1, "a", {TRUE}>>) :> (STRING))
====

(*--- recorded
all:
  exit: 0
  transcript: '| (<<1, "a", {TRUE}>> :> STRING)'
---*)
