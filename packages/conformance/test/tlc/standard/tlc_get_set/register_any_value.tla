(*---
description: A register holds any value.
ref: tlc2/module/TLCGetSet.java#TLCGetEval
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE register_any_value ----
EXTENDS TLC, Naturals
Test == TLCSet(3, {1}) /\ TLCGet(3) = {1} /\ TLCSet(3, [a |-> 1]) /\ TLCGet(3).a = 1
====

(*--- recorded
all:
  exit: 0
---*)
