(*---
description: random_element applied to subset, a SubsetValue.
ref: tlc2/module/TLC.java#RandomElement
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_element_subset ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(RandomElement(SUBSET {1, 2}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {2}"
---*)
