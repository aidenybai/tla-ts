(*---
description: Compares tuple_empty, a TupleValue, with function_strings, a FcnRcdValue.
ref: tlc2/value/impl/TupleValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_tuple_empty__function_strings ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<>>) = ([x \in {"a", "b"} |-> x]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
