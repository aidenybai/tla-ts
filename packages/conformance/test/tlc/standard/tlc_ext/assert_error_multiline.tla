(*---
description: AssertError matches a multi-line message written with \n.
ref: tlc2/module/TLCExt.java#assertError
features:
  - TLCExt
flags:
  - expression
  - exit-only
outcome: success
---*)
---- MODULE assert_error_multiline ----
EXTENDS TLCExt, TLC, Naturals, Sequences
Test == AssertError("The argument of Len should be a sequence, but instead it is:\n3", Len(3))
====

(*--- recorded
all:
  exit: 0
---*)
