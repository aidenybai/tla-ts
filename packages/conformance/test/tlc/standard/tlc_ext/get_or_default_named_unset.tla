(*---
description: An unset named register gives the default.
ref: tlc2/module/TLCExt.java#tlcGetOrDefault
features:
  - TLCExt
flags:
  - expression
outcome: success
---*)
---- MODULE get_or_default_named_unset ----
EXTENDS TLCExt, TLC, Naturals
Test == TLCGetOrDefault("s:nope", "d") = "d"
====

(*--- recorded
all:
  exit: 0
---*)
