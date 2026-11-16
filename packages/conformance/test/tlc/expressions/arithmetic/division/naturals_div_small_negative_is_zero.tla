(*---
description: "With EXTENDS Naturals, -1 \\div 2 is 0 instead of the floor -1, because Naturals.Divide decrements only when the truncated quotient is below zero. Integers.Divide returns -1."
ref: "tlc2/module/Naturals.java#Divide"
features: [tlc-bug]
flags: [expression]
outcome: success
correct:
  assume:
    exit: 10
    transcript: 2104:1 Assumption line 39, col 8 to line 39, col 11 of module naturals_div_small_negative_is_zero is false.
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
      2217:4 2: <Next line 41, col 9 to line 41, col 33 of module naturals_div_small_negative_is_zero>
      conformance_state = FALSE
  property:
    exit: 12
    transcript: |-
      2107:1 Invariant Prop is violated by the initial state:
      conformance_state = TRUE
---*)
---- MODULE naturals_div_small_negative_is_zero ----
EXTENDS Naturals
Test == (0 - 1) \div 2 = 0
====

(*--- recorded
all:
  exit: 0
---*)
