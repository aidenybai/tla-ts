(*---
description: A function over Nat stays lazy, so its failing body is never evaluated and AssertError is FALSE.
ref: tlc2/module/TLCExt.java#assertError
features:
  - TLCExt
flags:
  - expression
  - exit-only
outcome: success
---*)
---- MODULE assert_error_lazy_infinite_not_forced ----
EXTENDS TLCExt, TLC, Naturals
Test == ~AssertError("The second argument of \\div is 0.", [i \in Nat |-> i \div 0])
====

(*--- recorded
all:
  exit: 0
---*)
