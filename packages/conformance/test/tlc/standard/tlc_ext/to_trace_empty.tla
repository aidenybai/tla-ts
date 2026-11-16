(*---
description: ToTrace of an empty CounterExample is the empty sequence.
ref: tlc2/module/TLCExt.java#lassoOrdinal
features:
  - TLCExt
flags:
  - expression
outcome: success
---*)
---- MODULE to_trace_empty ----
EXTENDS TLCExt, TLC, Naturals
Test == ToTrace(CounterExample) = <<>>
====

(*--- recorded
all:
  exit: 0
---*)
