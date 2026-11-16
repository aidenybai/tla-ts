(*---
description: tuple_pattern applied to cross, a SetOfTuplesValue.
ref: tlc2/util/Context.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE tuple_pattern_cross ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({a : <<a, b>> \in {1, 2} \X {3}})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1, 2}"
---*)
