(*---
description: to_string applied to subset, a SubsetValue.
ref: tlc2/module/TLC.java#ToString
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE to_string_subset ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(ToString(SUBSET {1, 2}))
====

(*--- recorded
all:
  exit: 0
  transcript: '| "{{}, {1}, {2}, {1, 2}}"'
---*)
