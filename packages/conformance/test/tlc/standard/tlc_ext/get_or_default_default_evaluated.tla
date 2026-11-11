(*---
description: The default is evaluated eagerly, as an argument of a Java method.
ref: tlc2/module/TLCExt.java#tlcGetOrDefault
features:
  - TLCExt
flags:
  - expression
outcome: success
---*)
---- MODULE get_or_default_default_evaluated ----
EXTENDS TLCExt, TLC, Naturals
Test == TLCSet(52, 1) /\ TLCGetOrDefault(52, Print("evaluated", 2)) = 1
====

(*--- recorded
all:
  exit: 0
  transcript: '| "evaluated"  2'
---*)
