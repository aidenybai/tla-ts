(*---
description: A model value is a member of Any.
ref: tlc2/module/TLC.java#Any
features:
  - TLC
flags:
  - expression
outcome: success
config: |
  CONSTANT mv = mv
---*)
---- MODULE any_model_value ----
EXTENDS TLC, Naturals
CONSTANT mv
Test == mv \in Any
====

(*--- recorded
all:
  exit: 0
---*)
