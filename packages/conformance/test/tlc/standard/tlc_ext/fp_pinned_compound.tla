(*---
description: TLCFP under the runner's fixed polynomial, for compound values.
ref: tlc2/module/TLCExt.java#tlcFingerprint
features:
  - TLCExt
flags:
  - expression
outcome: success
---*)
---- MODULE fp_pinned_compound ----
EXTENDS TLCExt, TLC, Naturals
Test == PrintT(<<TLCFP(<<1>>), TLCFP({1}), TLCFP([a |-> 1]), TLCFP(<<>>), TLCFP({})>>)
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<883769222, -20272023, 708139487, 1056418748, 439769674>>"
---*)
