(*---
description: TLCGetAndSet stores Op(old, val).
ref: tla2sany/StandardModules/TLCExt.tla
features:
  - TLCExt
flags:
  - expression
outcome: success
---*)
---- MODULE get_and_set_updates ----
EXTENDS TLCExt, TLC, Naturals
Test == TLCSet(61, 5) /\ TLCGetAndSet(61, +, 2, 0) = 5 /\ TLCGet(61) = 7
====

(*--- recorded
all:
  exit: 0
---*)
