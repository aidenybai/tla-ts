(*---
description: "[Nat -> {}] has cardinality 0."
ref: tlc2/value/impl/SetOfFcnsValue.java#size
features:
  - FiniteSets
flags:
  - expression
outcome: success
---*)
---- MODULE card_function_set_empty_range_infinite_domain ----
EXTENDS FiniteSets, Naturals
Test == Cardinality([Nat -> {}]) = 0
====

(*--- recorded
all:
  exit: 0
---*)
