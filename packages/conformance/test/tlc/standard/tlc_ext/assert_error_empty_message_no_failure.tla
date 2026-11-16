(*---
description: An empty message is no wildcard.
ref: tlc2/module/TLCExt.java#assertError
features:
  - TLCExt
flags:
  - expression
  - exit-only
outcome: success
---*)
---- MODULE assert_error_empty_message_no_failure ----
EXTENDS TLCExt, TLC, Naturals
Test == ~AssertError("", 1 \div 0)
====

(*--- recorded
all:
  exit: 0
---*)
