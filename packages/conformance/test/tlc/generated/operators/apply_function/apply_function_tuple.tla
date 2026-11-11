(*---
description: apply_function applied to tuple, a TupleValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_function_tuple ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<1, 2>>)[1])
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1"
---*)
