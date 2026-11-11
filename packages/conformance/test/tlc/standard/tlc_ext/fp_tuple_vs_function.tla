(*---
description: A tuple and the equal function have one fingerprint.
ref: tlc2/module/TLCExt.java#tlcFingerprint
features:
  - TLCExt
flags:
  - expression
outcome: success
---*)
---- MODULE fp_tuple_vs_function ----
EXTENDS TLCExt, TLC, Naturals
Test == TLCFP(<<1, 2>>) = TLCFP([i \in 1..2 |-> i])
====

(*--- recorded
all:
  exit: 0
---*)
