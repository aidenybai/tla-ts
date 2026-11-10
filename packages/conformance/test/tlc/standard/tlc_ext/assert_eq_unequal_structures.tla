(*---
description: AssertEq prints each side through PrintT.
ref: tla2sany/StandardModules/TLCExt.tla
features:
  - TLCExt
flags:
  - expression
outcome: success
---*)
---- MODULE assert_eq_unequal_structures ----
EXTENDS TLCExt, TLC, Naturals
Test == ~AssertEq(<<1, {2}>>, [a |-> "b"] )
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | "Assertion failed"
    | <<1, {2}>>
    | [a |-> "b"]
---*)
