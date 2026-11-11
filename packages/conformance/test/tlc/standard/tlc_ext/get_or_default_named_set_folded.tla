(*---
description: A constant-level expression is folded while no checker exists. TLCSet to a named register then drops the value and returns TRUE, where an integer register throws and is retried, so the default comes back. Real TLC bug.
ref: tlc2/module/TLCGetSet.java#TLCSet
features:
  - TLCExt
  - tlc-bug
flags:
  - expression
outcome: success
correct:
  assume:
    exit: 10
    transcript: 2104:1 Assumption line 42, col 8 to line 42, col 11 of module get_or_default_named_set_folded is false.
  init:
    exit: 12
    transcript: |-
      2107:1 Invariant Inv is violated by the initial state:
      conformance_state = FALSE
  invariant:
    exit: 12
    transcript: |-
      2107:1 Invariant Inv is violated by the initial state:
      conformance_state = TRUE
  next:
    exit: 12
    transcript: |-
      2110:1 Invariant Inv is violated.
      2121:1 The behavior up to this point is:
      2217:4 1: <Initial predicate>
      conformance_state = TRUE
      2217:4 2: <Next line 44, col 9 to line 44, col 33 of module get_or_default_named_set_folded>
      conformance_state = FALSE
  property:
    exit: 12
    transcript: |-
      2107:1 Invariant Prop is violated by the initial state:
      conformance_state = TRUE
---*)
---- MODULE get_or_default_named_set_folded ----
EXTENDS TLCExt, TLC, Naturals
Test == TLCSet("s:yes", "v") /\ TLCGetOrDefault("s:yes", "d") = "d"
====

(*--- recorded
all:
  exit: 0
---*)
