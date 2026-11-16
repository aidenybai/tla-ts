(*---
description: diff of set_empty, a SetEnumValue, and false, a BoolValue.
ref: tlc2/value/impl/SetDiffValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE diff_set_empty__false ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) \ (FALSE))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
