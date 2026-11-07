(*---
description: AssertError matches TLC's Assert failure with its string quoted.
ref: tlc2/module/TLCExt.java#assertError
features:
  - TLCExt
flags:
  - expression
  - exit-only
outcome: success
---*)
---- MODULE assert_error_assert_message ----
EXTENDS TLCExt, TLC, Naturals
Test == AssertError("The first argument of Assert evaluated to FALSE; the second argument was:\n\"m\"", Assert(FALSE, "m"))
====

(*--- recorded
all:
  exit: 0
---*)
