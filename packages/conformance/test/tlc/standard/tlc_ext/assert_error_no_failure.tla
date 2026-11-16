(*---
description: AssertError is FALSE when the expression evaluates.
ref: tlc2/module/TLCExt.java#assertError
features:
  - TLCExt
flags:
  - expression
  - exit-only
outcome: success
---*)
---- MODULE assert_error_no_failure ----
EXTENDS TLCExt, TLC, Naturals
Test == ~AssertError("x", 1 + 1)
====

(*--- recorded
all:
  exit: 0
---*)
