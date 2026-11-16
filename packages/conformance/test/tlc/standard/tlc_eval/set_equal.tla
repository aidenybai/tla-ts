(*---
description: TLCEval of a set keeps it equal.
ref: tlc2/module/TLCEval.java#tlcEval
features:
  - TLCEval
flags:
  - expression
outcome: success
---*)
---- MODULE set_equal ----
EXTENDS TLC, Naturals
Test == TLCEval(1..3) = {1, 2, 3}
====

(*--- recorded
all:
  exit: 0
---*)
