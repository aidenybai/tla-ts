(*---
description: Any accepts a typed model value, which Nat and STRING reject with an error.
ref: tlc2/module/AnySet.java#member
features:
  - AnySet
flags:
  - expression
outcome: success
config: |
  CONSTANT T_a = T_a
---*)
---- MODULE typed_model_value_member ----
EXTENDS TLC
CONSTANT T_a
Test == T_a \in Any
====

(*--- recorded
all:
  exit: 0
---*)
