(*---
description: AssertError is FALSE when the expression fails with another message.
ref: tlc2/module/TLCExt.java#assertError
features:
  - TLCExt
flags:
  - expression
  - exit-only
outcome: success
---*)
---- MODULE assert_error_wrong_message ----
EXTENDS TLCExt, TLC, Naturals
Test == ~AssertError("wrong", 1 \div 0)
====

(*--- recorded
all:
  exit: 0
---*)
