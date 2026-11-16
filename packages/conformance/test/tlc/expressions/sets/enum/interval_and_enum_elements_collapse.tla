(*---
description: "A nested interval and the equal enumerated set are one element."
ref: "tlc2/value/impl/SetEnumValue.java#normalize"
flags: [expression]
outcome: success
---*)
---- MODULE interval_and_enum_elements_collapse ----
EXTENDS Integers, FiniteSets
Test == Cardinality({1..2, {1, 2}, {2, 1}}) = 1
====

(*--- recorded
all:
  exit: 0
---*)
