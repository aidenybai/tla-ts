(*---
description: Distinct names give distinct model values.
ref: tlc2/module/TLCExt.java#tlcModelValue
features:
  - TLCExt
flags:
  - expression
outcome: success
---*)
---- MODULE model_value_differs ----
EXTENDS TLCExt, TLC, Naturals
Test == TLCModelValue("a") # TLCModelValue("b")
====

(*--- recorded
all:
  exit: 0
---*)
