(*---
description: is_finite_set applied to subset, a SubsetValue.
ref: tlc2/module/FiniteSets.java#IsFiniteSet
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE is_finite_set_subset ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IsFiniteSet(SUBSET {1, 2}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
