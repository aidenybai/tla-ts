(*---
description: CounterExample has a state field and an action field.
ref: tlc2/module/TLCExt.java#error
features:
  - TLCExt
flags:
  - expression
outcome: success
---*)
---- MODULE counterexample_domain ----
EXTENDS TLCExt, TLC, Naturals
Test == DOMAIN CounterExample = {"state", "action"}
====

(*--- recorded
all:
  exit: 0
---*)
