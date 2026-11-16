(*---
description: TLCEvalDefinition evaluates a zero-arity definition by name.
ref: tlc2/module/TLCExt.java#tlcDefByName
features:
  - TLCExt
flags:
  - expression
outcome: success
---*)
---- MODULE eval_def_found ----
EXTENDS TLCExt, TLC, Naturals
D == 41
Test == TLCEvalDefinition("D") = 41
====

(*--- recorded
all:
  exit: 0
---*)
