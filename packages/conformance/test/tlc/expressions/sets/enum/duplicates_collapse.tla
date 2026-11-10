(*---
description: "A set enumeration removes duplicates when it is normalized."
ref: "tlc2/value/impl/SetEnumValue.java#normalize"
flags: [expression]
outcome: success
---*)
---- MODULE duplicates_collapse ----
EXTENDS Integers, FiniteSets
Test == Cardinality({1, 1, 2, 1}) = 2
====

(*--- recorded
all:
  exit: 0
---*)
