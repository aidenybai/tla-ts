(*---
description: TLCEval leaves Nat unchanged, since it has no enumerated form.
ref: tlc2/module/TLCEval.java#convert
features:
  - TLCEval
flags:
  - expression
outcome: success
---*)
---- MODULE nat_unchanged ----
EXTENDS TLC, Naturals
Test == PrintT(TLCEval(Nat))
====

(*--- recorded
all:
  exit: 0
  transcript: "| Nat"
---*)
