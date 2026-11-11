(*---
description: The same filter without TLCEval supports the membership test.
ref: tlc2/value/impl/SetPredValue.java#member
features:
  - TLCEval
flags:
  - expression
outcome: success
---*)
---- MODULE filter_over_nat_lazy_without_eval ----
EXTENDS TLC, Naturals
Test == 3 \in {n \in Nat : n > 2}
====

(*--- recorded
all:
  exit: 0
---*)
