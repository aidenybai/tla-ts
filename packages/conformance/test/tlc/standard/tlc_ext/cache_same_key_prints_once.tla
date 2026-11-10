(*---
description: With a constant expression, the same closure key evaluates it once.
ref: tlc2/module/TLCExt.java#tlcEval2
features:
  - TLCExt
flags:
  - expression
outcome: success
---*)
---- MODULE cache_same_key_prints_once ----
EXTENDS TLCExt, TLC, Naturals
Test == \A i \in 1..3 : TLCCache(Print("computed", 7), {}) = 7
====

(*--- recorded
all:
  exit: 0
  transcript: '| "computed"  7'
---*)
