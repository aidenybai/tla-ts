(*---
description: A key of another type gives the default, with no error.
ref: tlc2/module/TLCExt.java#tlcGetOrDefault
features:
  - TLCExt
flags:
  - expression
outcome: success
---*)
---- MODULE get_or_default_other_key_type ----
EXTENDS TLCExt, TLC, Naturals
Test == TLCGetOrDefault({1}, "d") = "d" /\ TLCGetOrDefault(TRUE, "d") = "d"
====

(*--- recorded
all:
  exit: 0
---*)
