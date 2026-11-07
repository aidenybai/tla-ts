(*---
description: TLCFP of a model value.
ref: tlc2/module/TLCExt.java#tlcFingerprint
features:
  - TLCExt
flags:
  - expression
outcome: success
config: |
  CONSTANT mv = mv
---*)
---- MODULE fp_pinned_model_value ----
EXTENDS TLCExt, TLC, Naturals
CONSTANT mv
Test == PrintT(TLCFP(mv))
====

(*--- recorded
all:
  exit: 0
  transcript: "| -887695703"
---*)
