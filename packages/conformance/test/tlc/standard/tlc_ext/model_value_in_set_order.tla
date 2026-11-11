(*---
description: Model values sort in a set among themselves.
ref: tlc2/module/TLCExt.java#tlcModelValue
features:
  - TLCExt
flags:
  - expression
outcome: success
---*)
---- MODULE model_value_in_set_order ----
EXTENDS TLCExt, TLC, Naturals
Test == PrintT({TLCModelValue("b"), TLCModelValue("a")})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {a, b}"
---*)
