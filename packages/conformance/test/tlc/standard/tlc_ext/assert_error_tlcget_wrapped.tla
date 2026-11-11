(*---
description: An @Evaluation override wraps a failure in its "Attempted to apply the operator overridden" text, so the bare message of TLCGet does not match.
ref: tlc2/value/impl/EvaluatingValue.java#eval
features:
  - TLCExt
flags:
  - expression
  - exit-only
outcome: success
---*)
---- MODULE assert_error_tlcget_wrapped ----
EXTENDS TLCExt, TLC, Naturals
Test == ~AssertError("TLCGet(99) was undefined.", TLCGet(99))
====

(*--- recorded
all:
  exit: 0
---*)
