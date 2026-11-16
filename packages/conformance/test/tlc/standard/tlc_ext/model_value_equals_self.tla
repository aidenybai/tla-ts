(*---
description: TLCModelValue of equal strings gives one value.
ref: tlc2/module/TLCExt.java#tlcModelValue
features:
  - TLCExt
flags:
  - expression
outcome: success
---*)
---- MODULE model_value_equals_self ----
EXTENDS TLCExt, TLC, Naturals
Test == TLCModelValue("a") = TLCModelValue("a")
====

(*--- recorded
all:
  exit: 0
---*)
