(*---
description: "[{} -> Nat] has cardinality 1."
ref: tlc2/value/impl/SetOfFcnsValue.java#size
features:
  - FiniteSets
flags:
  - expression
outcome: success
---*)
---- MODULE card_function_set_empty_domain_infinite_range ----
EXTENDS FiniteSets, Naturals
Test == Cardinality([{} -> Nat]) = 1
====

(*--- recorded
all:
  exit: 0
---*)
