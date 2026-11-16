(*---
description: subset_of applied to function_empty, a FcnRcdValue.
ref: tlc2/value/impl/SubsetValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subset_of_function_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SUBSET [x \in {} |-> x])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {{}}"
---*)
