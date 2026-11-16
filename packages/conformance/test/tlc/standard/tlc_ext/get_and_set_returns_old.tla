(*---
description: TLCGetAndSet returns the old value.
ref: tla2sany/StandardModules/TLCExt.tla
features:
  - TLCExt
flags:
  - expression
outcome: success
---*)
---- MODULE get_and_set_returns_old ----
EXTENDS TLCExt, TLC, Naturals
Test == TLCSet(60, 5) /\ TLCGetAndSet(60, +, 2, 0) = 5
====

(*--- recorded
all:
  exit: 0
---*)
