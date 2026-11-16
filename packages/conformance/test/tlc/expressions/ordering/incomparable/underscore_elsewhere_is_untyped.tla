(*---
description: "A name with _ later than position 1 is untyped."
ref: "tlc2/value/impl/ModelValue.java#ModelValue"
flags: [expression]
outcome: success
config: |
  CONSTANT ab_1 = ab_1
---*)
---- MODULE underscore_elsewhere_is_untyped ----
EXTENDS Integers
CONSTANT ab_1
Test == ab_1 # 1
====

(*--- recorded
all:
  exit: 0
---*)
