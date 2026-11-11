(*---
description: Different values differ here.
ref: tlc2/module/TLCExt.java#tlcFingerprint
features:
  - TLCExt
flags:
  - expression
outcome: success
---*)
---- MODULE fp_different_values ----
EXTENDS TLCExt, TLC, Naturals
Test == TLCFP(1) # TLCFP(2) /\ TLCFP("a") # TLCFP("b")
====

(*--- recorded
all:
  exit: 0
---*)
