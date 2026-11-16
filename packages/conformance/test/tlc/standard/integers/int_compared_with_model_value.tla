(*---
description: Int is unequal to an untyped model value.
ref: tlc2/module/Integers.java#compareTo
features:
  - Integers
flags:
  - expression
outcome: success
config: |
  CONSTANT mv = mv
---*)
---- MODULE int_compared_with_model_value ----
EXTENDS Integers
CONSTANT mv
Test == Int # mv
====

(*--- recorded
all:
  exit: 0
---*)
