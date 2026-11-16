(*---
description: An untyped model value is not in Int.
ref: tlc2/module/Integers.java#member
features:
  - Integers
flags:
  - expression
outcome: success
config: |
  CONSTANT mv = mv
---*)
---- MODULE int_untyped_model_value ----
EXTENDS Integers
CONSTANT mv
Test == mv \notin Int
====

(*--- recorded
all:
  exit: 0
---*)
