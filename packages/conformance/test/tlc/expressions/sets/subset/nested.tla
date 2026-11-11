(*---
description: "SUBSET can nest."
ref: "tlc2/value/impl/SubsetValue.java#size"
flags: [expression]
outcome: success
---*)
---- MODULE nested ----
EXTENDS Integers, FiniteSets
Test == Cardinality(SUBSET SUBSET {1, 2}) = 16
====

(*--- recorded
all:
  exit: 0
---*)
