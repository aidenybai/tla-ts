(*---
description: An unset integer register gives the default.
ref: tlc2/module/TLCExt.java#tlcGetOrDefault
features:
  - TLCExt
flags:
  - expression
outcome: success
---*)
---- MODULE get_or_default_unset ----
EXTENDS TLCExt, TLC, Naturals
Test == TLCGetOrDefault(50, "d") = "d"
====

(*--- recorded
all:
  exit: 0
---*)
