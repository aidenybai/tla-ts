(*---
description: :> takes a model value as key.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - TLC
flags:
  - expression
outcome: success
config: |
  CONSTANT mv = mv
---*)
---- MODULE colon_greater_model_value_key ----
EXTENDS TLC, Naturals
CONSTANT mv
Test == (mv :> 1)[mv] = 1
====

(*--- recorded
all:
  exit: 0
---*)
