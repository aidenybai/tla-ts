(*---
description: A constant-level expression is folded while no checker exists. TLCSet to a named register then drops the value and returns TRUE, where an integer register throws and is retried, so the default comes back. Real TLC bug.
ref: tlc2/module/TLCGetSet.java#TLCSet
features:
  - TLCExt
  - tlc-bug
flags:
  - expression
outcome: success
---*)
---- MODULE get_or_default_named_set_folded ----
EXTENDS TLCExt, TLC, Naturals
Test == TLCSet("s:yes", "v") /\ TLCGetOrDefault("s:yes", "d") = "d"
====

(*--- recorded
all:
  exit: 0
---*)
