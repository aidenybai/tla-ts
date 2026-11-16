(*---
description: subset_of applied to tuple_empty, a TupleValue.
ref: tlc2/value/impl/SubsetValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subset_of_tuple_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SUBSET <<>>)
====

(*--- recorded
all:
  exit: 0
  transcript: "| {{}}"
---*)
