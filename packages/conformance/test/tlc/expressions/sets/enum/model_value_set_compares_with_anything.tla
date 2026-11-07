(*---
description: "An untyped model value is unequal to values of any type, inside sets as well."
ref: "tlc2/value/impl/ModelValue.java#equals"
flags: [expression]
outcome: success
config: |
  CONSTANT mv = mv
---*)
---- MODULE model_value_set_compares_with_anything ----
EXTENDS Integers
CONSTANT mv
Test == {mv} # {1} /\ {1} # {mv} /\ mv \notin {1, 2}
====

(*--- recorded
all:
  exit: 0
---*)
