(*---
description: 65536*65536 wraps to 0 in int arithmetic but TLC detects the overflow.
ref: tlc2/module/Naturals.java#Times
features:
  - Naturals
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE times_overflow_wraps_to_zero ----
EXTENDS Naturals
Test == 65536 * 65536 = 0
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 65536*65536
    2178:0 Overflow when computing 65536*65536
init:
  exit: 75
  transcript: |-
    2178:0 Overflow when computing 65536*65536
    2178:0 Overflow when computing 65536*65536
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in times_overflow_wraps_to_zero
    1. Line 14, column 29 to line 14, column 32 in times_overflow_wraps_to_zero
    2. Line 12, column 9 to line 12, column 25 in times_overflow_wraps_to_zero
    3. Line 12, column 9 to line 12, column 21 in times_overflow_wraps_to_zero
next:
  exit: 255
  transcript: |-
    2178:1 Overflow when computing 65536*65536
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in times_overflow_wraps_to_zero
    1. Line 15, column 30 to line 15, column 33 in times_overflow_wraps_to_zero
    2. Line 12, column 9 to line 12, column 25 in times_overflow_wraps_to_zero
    3. Line 12, column 9 to line 12, column 21 in times_overflow_wraps_to_zero
invariant:
  exit: 75
  transcript: |-
    2178:0 Overflow when computing 65536*65536
    2178:0 Overflow when computing 65536*65536
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in times_overflow_wraps_to_zero
    1. Line 16, column 8 to line 16, column 32 in times_overflow_wraps_to_zero
    2. Line 16, column 29 to line 16, column 32 in times_overflow_wraps_to_zero
    3. Line 12, column 9 to line 12, column 25 in times_overflow_wraps_to_zero
    4. Line 12, column 9 to line 12, column 21 in times_overflow_wraps_to_zero
property:
  exit: 75
  transcript: |-
    2178:0 Overflow when computing 65536*65536
    2178:0 Overflow when computing 65536*65536
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in times_overflow_wraps_to_zero
    1. Line 15, column 12 to line 15, column 36 in times_overflow_wraps_to_zero
    2. Line 15, column 33 to line 15, column 36 in times_overflow_wraps_to_zero
    3. Line 12, column 9 to line 12, column 25 in times_overflow_wraps_to_zero
    4. Line 12, column 9 to line 12, column 21 in times_overflow_wraps_to_zero
---*)
