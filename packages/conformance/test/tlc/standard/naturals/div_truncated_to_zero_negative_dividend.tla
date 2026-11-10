(*---
description: "Naturals.Divide only decrements when the truncated quotient is negative, so -1 \\div 2 gives 0, not the floor -1 that Integers.Divide gives. Real TLC bug: the result depends on whether Integers is extended."
ref: tlc2/module/Naturals.java#Divide
features:
  - Naturals
  - tlc-bug
flags:
  - expression
outcome: success
correct:
  assume:
    exit: 10
    transcript: 2104:1 Assumption line 42, col 8 to line 42, col 11 of module div_truncated_to_zero_negative_dividend is false.
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
      2217:4 2: <Next line 44, col 9 to line 44, col 33 of module div_truncated_to_zero_negative_dividend>
      conformance_state = FALSE
  property:
    exit: 12
    transcript: |-
      2107:1 Invariant Prop is violated by the initial state:
      conformance_state = TRUE
---*)
---- MODULE div_truncated_to_zero_negative_dividend ----
EXTENDS Naturals
Test == (0 - 1) \div 2 = 0
====

(*--- recorded
all:
  exit: 0
---*)
