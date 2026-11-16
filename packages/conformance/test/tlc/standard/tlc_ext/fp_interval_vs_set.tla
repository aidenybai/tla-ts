(*---
description: An interval and the equal set have one fingerprint.
ref: tlc2/module/TLCExt.java#tlcFingerprint
features:
  - TLCExt
flags:
  - expression
outcome: success
---*)
---- MODULE fp_interval_vs_set ----
EXTENDS TLCExt, TLC, Naturals
Test == TLCFP(1..3) = TLCFP({1, 2, 3})
====

(*--- recorded
all:
  exit: 0
---*)
