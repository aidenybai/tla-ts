(*---
description: apply of tuple_mixed, a TupleValue, and int_one, a IntValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_tuple_mixed__int_one ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<1, "a", {TRUE}>>)[1])
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1"
---*)
