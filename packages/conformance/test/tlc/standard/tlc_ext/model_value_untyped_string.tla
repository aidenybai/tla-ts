(*---
description: An untyped model value is unequal to a string, even one with its name.
ref: tlc2/module/TLCExt.java#tlcModelValue
features:
  - TLCExt
flags:
  - expression
outcome: success
---*)
---- MODULE model_value_untyped_string ----
EXTENDS TLCExt, TLC, Naturals
Test == TLCModelValue("a") # "a"
====

(*--- recorded
all:
  exit: 0
---*)
