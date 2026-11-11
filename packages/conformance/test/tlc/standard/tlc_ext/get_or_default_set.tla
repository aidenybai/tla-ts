(*---
description: A set register wins over the default.
ref: tlc2/module/TLCExt.java#tlcGetOrDefault
features:
  - TLCExt
flags:
  - expression
outcome: success
---*)
---- MODULE get_or_default_set ----
EXTENDS TLCExt, TLC, Naturals
Test == TLCSet(51, "v") /\ TLCGetOrDefault(51, "d") = "v"
====

(*--- recorded
all:
  exit: 0
---*)
