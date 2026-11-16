(*---
description: "An untyped model value is unequal to Nat, on either side of =."
ref: "tlc2/value/impl/UserValue.java#compareTo"
flags: [expression]
outcome: success
config: |
  CONSTANT mv = mv
---*)
---- MODULE nat_with_model_value ----
EXTENDS Integers
CONSTANT mv
Test == mv # Nat
====

(*--- recorded
all:
  exit: 0
---*)
