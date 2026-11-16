(*---
description: An expression under a bound variable has a non-empty context, so it is evaluated afresh each time.
ref: tlc2/module/TLCEval.java#tlcEval
features:
  - TLCEval
flags:
  - expression
outcome: success
---*)
---- MODULE bound_variable_not_cached ----
EXTENDS TLC, Naturals
Test == \A i \in 1..3 : TLCEval(i + 1) = i + 1
====

(*--- recorded
all:
  exit: 0
---*)
