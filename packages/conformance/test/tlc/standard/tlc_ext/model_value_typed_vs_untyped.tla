(*---
description: A typed model value compares with an untyped one.
ref: tlc2/module/TLCExt.java#tlcModelValue
features:
  - TLCExt
flags:
  - expression
outcome: success
---*)
---- MODULE model_value_typed_vs_untyped ----
EXTENDS TLCExt, TLC, Naturals
Test == TLCModelValue("T_a") # TLCModelValue("a")
====

(*--- recorded
all:
  exit: 0
---*)
