(*---
description: Naturals.Divide gives 1 \div -2 = 0 where Integers.Divide gives the floor -1. Real TLC bug, the same one as for a negative dividend.
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
    transcript: 2104:1 Assumption line 42, col 8 to line 42, col 11 of module div_truncated_to_zero_negative_divisor is false.
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
      2217:4 2: <Next line 44, col 9 to line 44, col 33 of module div_truncated_to_zero_negative_divisor>
      conformance_state = FALSE
  property:
    exit: 12
    transcript: |-
      2107:1 Invariant Prop is violated by the initial state:
      conformance_state = TRUE
---*)
---- MODULE div_truncated_to_zero_negative_divisor ----
EXTENDS Naturals
Test == 1 \div (0 - 2) = 0
====

(*--- recorded
all:
  exit: 0
---*)
