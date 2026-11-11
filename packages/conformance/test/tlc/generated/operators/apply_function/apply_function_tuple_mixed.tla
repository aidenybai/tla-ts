(*---
description: apply_function applied to tuple_mixed, a TupleValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_function_tuple_mixed ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<1, "a", {TRUE}>>)[1])
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1"
---*)
