(*---
description: A config's constant with the same name is the same model value.
ref: tlc2/module/TLCExt.java#tlcModelValue
features:
  - TLCExt
flags:
  - expression
outcome: success
config: |
  CONSTANT mv = mv
---*)
---- MODULE model_value_config_same_name ----
EXTENDS TLCExt, TLC, Naturals
CONSTANT mv
Test == mv = TLCModelValue("mv")
====

(*--- recorded
all:
  exit: 0
---*)
