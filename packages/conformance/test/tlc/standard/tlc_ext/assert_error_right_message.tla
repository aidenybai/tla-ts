(*---
description: AssertError is TRUE when the expression fails with exactly the given message.
ref: tlc2/module/TLCExt.java#assertError
features:
  - TLCExt
flags:
  - expression
  - exit-only
outcome: success
---*)
---- MODULE assert_error_right_message ----
EXTENDS TLCExt, TLC, Naturals
Test == AssertError("The second argument of \\div is 0.", 1 \div 0)
====

(*--- recorded
all:
  exit: 0
---*)
