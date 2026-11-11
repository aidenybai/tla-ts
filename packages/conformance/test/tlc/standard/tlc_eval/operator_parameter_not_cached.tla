(*---
description: An expression over an operator parameter is evaluated afresh each call.
ref: tlc2/module/TLCEval.java#tlcEval
features:
  - TLCEval
flags:
  - expression
outcome: success
---*)
---- MODULE operator_parameter_not_cached ----
EXTENDS TLC, Naturals
F(x) == TLCEval(x + 1)
Test == F(1) = 2 /\ F(2) = 3
====

(*--- recorded
all:
  exit: 0
---*)
