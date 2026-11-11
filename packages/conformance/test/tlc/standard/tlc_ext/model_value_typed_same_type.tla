(*---
description: Typed model values of a type compare among themselves.
ref: tlc2/module/TLCExt.java#tlcModelValue
features:
  - TLCExt
flags:
  - expression
outcome: success
---*)
---- MODULE model_value_typed_same_type ----
EXTENDS TLCExt, TLC, Naturals
Test == TLCModelValue("T_a") # TLCModelValue("T_b")
====

(*--- recorded
all:
  exit: 0
---*)
