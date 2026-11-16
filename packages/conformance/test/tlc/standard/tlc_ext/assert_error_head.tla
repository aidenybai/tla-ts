(*---
description: AssertError matches the message of Head on the empty sequence.
ref: tlc2/module/TLCExt.java#assertError
features:
  - TLCExt
flags:
  - expression
  - exit-only
outcome: success
---*)
---- MODULE assert_error_head ----
EXTENDS TLCExt, TLC, Naturals, Sequences
Test == AssertError("Attempted to apply Head to the empty sequence.", Head(<<>>))
====

(*--- recorded
all:
  exit: 0
---*)
