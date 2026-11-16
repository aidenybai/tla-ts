(*---
description: TLCFP normalizes, so equal sets in any order have one fingerprint.
ref: tlc2/module/TLCExt.java#tlcFingerprint
features:
  - TLCExt
flags:
  - expression
outcome: success
---*)
---- MODULE fp_set_order ----
EXTENDS TLCExt, TLC, Naturals
Test == TLCFP({1, 2}) = TLCFP({2, 1})
====

(*--- recorded
all:
  exit: 0
---*)
