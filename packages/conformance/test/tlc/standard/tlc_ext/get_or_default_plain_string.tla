(*---
description: "A string without the s: prefix always gives the default."
ref: tlc2/module/TLCExt.java#tlcGetOrDefault
features:
  - TLCExt
flags:
  - expression
outcome: success
---*)
---- MODULE get_or_default_plain_string ----
EXTENDS TLCExt, TLC, Naturals
Test == TLCGetOrDefault("level", "d") = "d"
====

(*--- recorded
all:
  exit: 0
---*)
