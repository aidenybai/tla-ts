(*---
description: TLCGetAndSet works with a named register.
ref: tla2sany/StandardModules/TLCExt.tla
features:
  - TLCExt
flags:
  - expression
outcome: success
---*)
---- MODULE get_and_set_named ----
EXTENDS TLCExt, TLC, Naturals
Test == TLCGetAndSet("s:c", +, 1, 0) = 0 /\ TLCGetAndSet("s:c", +, 1, 0) = 1 /\ TLCGet("s:c") = 2
====

(*--- recorded
all:
  exit: 0
---*)
