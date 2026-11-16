(*---
description: tuple_pattern applied to set_empty, a SetEnumValue.
ref: tlc2/util/Context.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE tuple_pattern_set_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({a : <<a, b>> \in {}})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
