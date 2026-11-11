(*---
description: TLCDefer evaluates to TRUE at once in every context, printing nothing.
ref: tlc2/module/TLCExt.java#tlcDefer
features:
  - TLCExt
flags:
  - expression
outcome: success
---*)
---- MODULE defer_true_in_any_context ----
EXTENDS TLCExt, TLC, Naturals
Test == TLCDefer(PrintT("deferred"))
====

(*--- recorded
all:
  exit: 0
---*)
