(*---
description: TLCEvalDefinition evaluates the definition's TLA+ body, skipping Java overrides, so Nat is the { } written in Naturals.tla.
ref: tlc2/module/TLCExt.java#tlcDefByName
features:
  - TLCExt
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
