(*---
description: An untyped model value is unequal to an integer, with no error.
ref: tlc2/module/TLCExt.java#tlcModelValue
features:
  - TLCExt
flags:
  - expression
outcome: success
---*)
---- MODULE model_value_untyped_int ----
EXTENDS TLCExt, TLC, Naturals
Test == TLCModelValue("a") # 1
====

(*--- recorded
all:
  exit: 0
---*)
