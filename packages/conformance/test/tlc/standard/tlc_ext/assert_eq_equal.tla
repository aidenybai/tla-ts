(*---
description: AssertEq of equal values is TRUE and prints nothing.
ref: tla2sany/StandardModules/TLCExt.tla
features:
  - TLCExt
flags:
  - expression
outcome: success
---*)
---- MODULE assert_eq_equal ----
EXTENDS TLCExt, TLC, Naturals
Test == AssertEq(1, 1) /\ AssertEq({1, 2}, {2, 1})
====

(*--- recorded
all:
  exit: 0
---*)
