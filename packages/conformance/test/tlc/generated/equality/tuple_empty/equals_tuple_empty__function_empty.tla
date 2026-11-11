(*---
description: Compares tuple_empty, a TupleValue, with function_empty, a FcnRcdValue.
ref: tlc2/value/impl/TupleValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_tuple_empty__function_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<>>) = ([x \in {} |-> x]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
