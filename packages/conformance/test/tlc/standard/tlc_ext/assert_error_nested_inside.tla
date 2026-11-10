(*---
description: An error nested inside the expression is caught.
ref: tlc2/module/TLCExt.java#assertError
features:
  - TLCExt
flags:
  - expression
  - exit-only
outcome: success
---*)
---- MODULE assert_error_nested_inside ----
EXTENDS TLCExt, TLC, Naturals
Test == AssertError("The second argument of \\div is 0.", <<1, 1 \div 0>>)
====

(*--- recorded
all:
  exit: 0
---*)
