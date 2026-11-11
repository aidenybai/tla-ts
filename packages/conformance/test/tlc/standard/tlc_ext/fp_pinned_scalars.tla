(*---
description: TLCFP under the runner's fixed polynomial, for scalars.
ref: tlc2/module/TLCExt.java#tlcFingerprint
features:
  - TLCExt
flags:
  - expression
outcome: success
---*)
---- MODULE fp_pinned_scalars ----
EXTENDS TLCExt, TLC, Naturals
Test == PrintT(<<TLCFP(0), TLCFP(1), TLCFP(TRUE), TLCFP("a")>>)
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<231594371, -1504394061, -767817129, -1022804895>>"
---*)
