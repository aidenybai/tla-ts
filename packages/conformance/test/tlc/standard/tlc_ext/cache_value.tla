(*---
description: TLCCache gives the expression's value in every context.
ref: tlc2/module/TLCExt.java#tlcEval2
features:
  - TLCExt
flags:
  - expression
outcome: success
---*)
---- MODULE cache_value ----
EXTENDS TLCExt, TLC, Naturals
Test == TLCCache(1 + 1, 0) = 2
====

(*--- recorded
all:
  exit: 0
---*)
