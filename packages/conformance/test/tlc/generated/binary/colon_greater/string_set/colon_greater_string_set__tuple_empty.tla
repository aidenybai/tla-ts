(*---
description: colon_greater of string_set, a UserValue, and tuple_empty, a TupleValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_string_set__tuple_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((STRING) :> (<<>>))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (STRING :> <<>>)"
---*)
