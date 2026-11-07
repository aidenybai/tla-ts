(*---
description: A typed model value from the config is the same value.
ref: tlc2/module/TLCExt.java#tlcModelValue
features:
  - TLCExt
flags:
  - expression
outcome: success
config: |
  CONSTANT T_a = T_a
---*)
---- MODULE model_value_typed_config ----
EXTENDS TLCExt, TLC, Naturals
CONSTANT T_a
Test == T_a = TLCModelValue("T_a")
====

(*--- recorded
all:
  exit: 0
---*)
