(*---
description: "[S -> {}] is {} for a non-empty S."
ref: "tlc2/value/impl/SetOfFcnsValue.java#size"
flags: [expression]
outcome: success
---*)
---- MODULE empty_range_is_empty ----
EXTENDS Integers, FiniteSets
Test == [{1} -> {}] = {} /\ Cardinality([1..3 -> {}]) = 0
====

(*--- recorded
all:
  exit: 0
---*)
