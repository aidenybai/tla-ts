(*---
description: An untyped model value is not in STRING.
ref: tlc2/module/Strings.java#member
features:
  - Strings
flags:
  - expression
outcome: success
config: |
  CONSTANT mv = mv
---*)
---- MODULE untyped_model_value_member ----
EXTENDS TLC
CONSTANT mv
Test == mv \notin STRING
====

(*--- recorded
all:
  exit: 0
---*)
