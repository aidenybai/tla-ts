(*---
description: A set with a duplicate has the same fingerprint.
ref: tlc2/module/TLCExt.java#tlcFingerprint
features:
  - TLCExt
flags:
  - expression
outcome: success
---*)
---- MODULE fp_set_duplicates ----
EXTENDS TLCExt, TLC, Naturals
Test == TLCFP({1, 1}) = TLCFP({1})
====

(*--- recorded
all:
  exit: 0
---*)
