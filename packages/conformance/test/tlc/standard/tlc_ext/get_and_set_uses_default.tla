(*---
description: An unset register uses the default as old.
ref: tla2sany/StandardModules/TLCExt.tla
features:
  - TLCExt
flags:
  - expression
outcome: success
---*)
---- MODULE get_and_set_uses_default ----
EXTENDS TLCExt, TLC, Naturals
Test == TLCGetAndSet(62, +, 2, 10) = 10 /\ TLCGet(62) = 12
====

(*--- recorded
all:
  exit: 0
---*)
