(*---
description: Under -tool the failure's message carries TLC's tool markup, so an exact message does not match. That is why AssertError tests run without -tool.
ref: tlc2/output/MP.java#getError
features:
  - TLCExt
flags:
  - expression
outcome: success
---*)
---- MODULE assert_error_tool_mode_wraps ----
EXTENDS TLCExt, TLC, Naturals
Test == ~AssertError("The second argument of \\div is 0.", 1 \div 0)
====

(*--- recorded
all:
  exit: 0
---*)
