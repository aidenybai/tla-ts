(*---
description: colon_greater of tuple_empty, a TupleValue, and string_set, a UserValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_tuple_empty__string_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<>>) :> (STRING))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (<<>> :> STRING)"
---*)
