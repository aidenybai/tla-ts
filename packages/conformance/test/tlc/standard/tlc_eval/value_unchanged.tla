(*---
description: TLCEval is the identity on values.
ref: tlc2/module/TLCEval.java#tlcEval
features:
  - TLCEval
flags:
  - expression
outcome: success
---*)
---- MODULE value_unchanged ----
EXTENDS TLC, Naturals
Test == TLCEval(1 + 1) = 2 /\ TLCEval("a") = "a" /\ TLCEval(<<1>>) = <<1>>
====

(*--- recorded
all:
  exit: 0
---*)
