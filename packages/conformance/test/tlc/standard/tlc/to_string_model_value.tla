(*---
description: ToString of a model value is its name.
ref: tlc2/module/TLC.java#ToString
features:
  - TLC
flags:
  - expression
outcome: success
config: |
  CONSTANT mv = mv
---*)
---- MODULE to_string_model_value ----
EXTENDS TLC, Naturals
CONSTANT mv
Test == ToString(mv) = "mv"
====

(*--- recorded
all:
  exit: 0
---*)
