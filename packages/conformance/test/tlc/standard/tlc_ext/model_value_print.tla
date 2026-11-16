(*---
description: A model value prints bare.
ref: tlc2/module/TLCExt.java#tlcModelValue
features:
  - TLCExt
flags:
  - expression
outcome: success
---*)
---- MODULE model_value_print ----
EXTENDS TLCExt, TLC, Naturals
Test == PrintT(TLCModelValue("abc"))
====

(*--- recorded
all:
  exit: 0
  transcript: "| abc"
---*)
