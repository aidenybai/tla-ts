(*---
description: tuple_pattern applied to subset, a SubsetValue.
ref: tlc2/util/Context.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE tuple_pattern_subset ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({a : <<a, b>> \in SUBSET {1, 2}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2170:0 Argument mismatch in operator application.%1
    2170:0 Argument mismatch in operator application.%1
---*)
