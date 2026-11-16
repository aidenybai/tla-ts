(*---
description: A negative index is not checked, unlike TLCGet, and gives the default.
ref: tlc2/module/TLCExt.java#tlcGetOrDefault
features:
  - TLCExt
flags:
  - expression
outcome: success
---*)
---- MODULE get_or_default_negative ----
EXTENDS TLCExt, TLC, Integers
Test == TLCGetOrDefault(-1, "d") = "d"
====

(*--- recorded
all:
  exit: 0
---*)
