(*---
description: A record and the equal function on strings have one fingerprint.
ref: tlc2/module/TLCExt.java#tlcFingerprint
features:
  - TLCExt
flags:
  - expression
outcome: success
---*)
---- MODULE fp_record_vs_function ----
EXTENDS TLCExt, TLC, Naturals
Test == TLCFP([a |-> 1]) = TLCFP("a" :> 1)
====

(*--- recorded
all:
  exit: 0
---*)
