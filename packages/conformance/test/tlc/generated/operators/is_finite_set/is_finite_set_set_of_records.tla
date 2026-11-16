(*---
description: is_finite_set applied to set_of_records, a SetOfRcdsValue.
ref: tlc2/module/FiniteSets.java#IsFiniteSet
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE is_finite_set_set_of_records ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IsFiniteSet([a : {1, 2}]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
