(*---
description: The cache hangs on the expression's node, so an operator parameter with one closure also keeps the first value.
ref: tlc2/module/TLCExt.java#tlcEval2
features:
  - TLCExt
flags:
  - expression
outcome: success
---*)
---- MODULE cache_stale_operator_parameter ----
EXTENDS TLCExt, TLC, Naturals
F(n) == TLCCache(n, 0)
Test == F(1) = 1 /\ F(2) = 1
====

(*--- recorded
all:
  exit: 0
---*)
