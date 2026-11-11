(*---
description: "SUBSET {} is {{}}."
ref: "tlc2/value/impl/SubsetValue.java#size"
flags: [expression]
outcome: success
---*)
---- MODULE of_empty ----
EXTENDS Integers, FiniteSets
Test == SUBSET {} = {{}} /\ Cardinality(SUBSET {}) = 1
====

(*--- recorded
all:
  exit: 0
---*)
