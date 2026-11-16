(*---
description: AssertEq of unequal values prints a banner and both values, then is FALSE.
ref: tla2sany/StandardModules/TLCExt.tla
features:
  - TLCExt
flags:
  - expression
outcome: success
---*)
---- MODULE assert_eq_unequal ----
EXTENDS TLCExt, TLC, Naturals
Test == ~AssertEq(1, 2)
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | "Assertion failed"
    | 1
    | 2
---*)
