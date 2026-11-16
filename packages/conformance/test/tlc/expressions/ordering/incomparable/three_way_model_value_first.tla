(*---
description: "Sorting {mv, \"a\"} succeeds, because an untyped model value compares with anything."
ref: "tlc2/value/impl/ModelValue.java#compareTo"
flags: [expression]
outcome: success
config: |
  CONSTANT mv = mv
---*)
---- MODULE three_way_model_value_first ----
EXTENDS Integers, FiniteSets
CONSTANT mv
Test == Cardinality({mv, "a"}) = 2
====

(*--- recorded
all:
  exit: 0
---*)
