(*---
description: TLCEvalDefinition evaluates the definition's TLA+ body, skipping Java overrides, so Nat is the { } written in Naturals.tla. Real TLC bug, as Nat is the set of natural numbers.
ref: tlc2/module/TLCExt.java#tlcDefByName
features:
  - TLCExt
  - tlc-bug
flags:
  - expression
outcome: success
---*)
---- MODULE eval_def_extended_skips_override ----
EXTENDS TLCExt, TLC, Naturals
Test == TLCEvalDefinition("Nat") = {}
====

(*--- recorded
all:
  exit: 0
---*)
