(*---
description: Compares tuple_mixed, a TupleValue, with model_value, a ModelValue.
ref: tlc2/value/impl/TupleValue.java#equals
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
---- MODULE equals_tuple_mixed__model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT((<<1, "a", {TRUE}>>) = (mv))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
