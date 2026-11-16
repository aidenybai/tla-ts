(*---
description: "A lazily held failing body is forced when evaluated: a function with a finite domain converts at once."
ref: tlc2/module/TLCExt.java#assertError
features:
  - TLCExt
flags:
  - expression
  - exit-only
outcome: success
---*)
---- MODULE assert_error_lazy_not_forced ----
EXTENDS TLCExt, TLC, Naturals
Test == AssertError("The second argument of \\div is 0.", [i \in 1..1 |-> i \div 0])
====

(*--- recorded
all:
  exit: 0
---*)
