(*---
description: An empty name is a model value too.
ref: tlc2/module/TLCExt.java#tlcModelValue
features:
  - TLCExt
flags:
  - expression
outcome: success
---*)
---- MODULE model_value_empty_name ----
EXTENDS TLCExt, TLC, Naturals
Test == TLCModelValue("") = TLCModelValue("")
====

(*--- recorded
all:
  exit: 0
---*)
