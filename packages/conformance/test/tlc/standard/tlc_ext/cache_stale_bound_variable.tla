(*---
description: "A body over a bound variable is still constant-level, so with one closure the first value stays: both evaluations are 1. The closure is how the spec must say what the value depends on."
ref: tlc2/module/TLCExt.java#tlcEval2
features:
  - TLCExt
flags:
  - expression
outcome: success
---*)
---- MODULE cache_stale_bound_variable ----
EXTENDS TLCExt, TLC, Naturals
Test == \A i \in 1..2 : TLCCache(i, {}) = 1
====

(*--- recorded
all:
  exit: 0
---*)
