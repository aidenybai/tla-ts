(*---
description: "A typed model value compares with an untyped one."
ref: "tlc2/value/impl/ModelValue.java#compareTo"
flags: [expression]
outcome: success
config: |
  CONSTANT t_1 = t_1
  CONSTANT mv = mv
---*)
---- MODULE typed_with_untyped_compares ----
EXTENDS Integers, FiniteSets
CONSTANT t_1, mv
Test == Cardinality({t_1, mv}) = 2 /\ t_1 # mv
====

(*--- recorded
all:
  exit: 0
---*)
