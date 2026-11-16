(*---
description: TLCGet("spec") answers in every context.
ref: tlc2/module/TLCGetSet.java#TLCGetStringValue
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE spec_in_any_context ----
EXTENDS TLC, Naturals
Test == "variables" \in DOMAIN TLCGet("spec")
====

(*--- recorded
all:
  exit: 0
---*)
