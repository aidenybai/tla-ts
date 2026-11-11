(*---
description: A different closure key evaluates a constant expression again.
ref: tlc2/module/TLCExt.java#tlcEval2
features:
  - TLCExt
flags:
  - expression
outcome: success
---*)
---- MODULE cache_different_keys ----
EXTENDS TLCExt, TLC, Naturals
Test == \A i \in 1..2 : TLCCache(Print("computed", 7), {i}) = 7
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | "computed"  7
    | "computed"  7
---*)
