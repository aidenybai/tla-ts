(*---
description: Compares model_value, a ModelValue, with tuple_mixed, a TupleValue.
ref: tlc2/value/impl/ModelValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
config: |
  CONSTANT mv = mv
---*)
---- MODULE equals_model_value__tuple_mixed ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT((mv) = (<<1, "a", {TRUE}>>))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
