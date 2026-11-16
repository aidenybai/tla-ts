(*---
description: Any accepts a model value, without the check other built-in sets do.
ref: tlc2/module/AnySet.java#member
features:
  - AnySet
flags:
  - expression
outcome: success
config: |
  CONSTANT mv = mv
---*)
---- MODULE model_value_member ----
EXTENDS TLC
CONSTANT mv
Test == mv \in Any
====

(*--- recorded
all:
  exit: 0
---*)
