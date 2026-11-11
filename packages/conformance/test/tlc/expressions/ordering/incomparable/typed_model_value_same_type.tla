(*---
description: "Typed model values of one type compare."
ref: "tlc2/value/impl/ModelValue.java#compareTo"
flags: [expression]
outcome: success
config: |
  CONSTANT t_1 = t_1
  CONSTANT t_2 = t_2
---*)
---- MODULE typed_model_value_same_type ----
EXTENDS Integers, FiniteSets
CONSTANT t_1, t_2
Test == Cardinality({t_1, t_2}) = 2
====

(*--- recorded
all:
  exit: 0
---*)
