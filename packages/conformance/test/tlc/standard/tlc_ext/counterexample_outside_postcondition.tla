(*---
description: CounterExample outside POSTCONDITION is empty.
ref: tlc2/module/TLCExt.java#error
features:
  - TLCExt
flags:
  - expression
outcome: success
---*)
---- MODULE counterexample_outside_postcondition ----
EXTENDS TLCExt, TLC, Naturals
Test == PrintT(CounterExample)
====

(*--- recorded
all:
  exit: 0
  transcript: "| [action |-> {}, state |-> {}]"
---*)
