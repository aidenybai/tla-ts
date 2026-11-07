(*---
description: 65536*32768 is exactly 2^31, one past the maximum.
ref: tlc2/module/Naturals.java#Times
features:
  - Naturals
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE times_overflow_exactly_2_31 ----
EXTENDS Naturals
Test == 65536 * 32768 = 0
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 65536*32768
    2178:0 Overflow when computing 65536*32768
init:
  exit: 75
  transcript: |-
    2178:0 Overflow when computing 65536*32768
    2178:0 Overflow when computing 65536*32768
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in times_overflow_exactly_2_31
    1. Line 14, column 29 to line 14, column 32 in times_overflow_exactly_2_31
    2. Line 12, column 9 to line 12, column 25 in times_overflow_exactly_2_31
    3. Line 12, column 9 to line 12, column 21 in times_overflow_exactly_2_31
next:
  exit: 255
  transcript: |-
    2178:1 Overflow when computing 65536*32768
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in times_overflow_exactly_2_31
    1. Line 15, column 30 to line 15, column 33 in times_overflow_exactly_2_31
    2. Line 12, column 9 to line 12, column 25 in times_overflow_exactly_2_31
    3. Line 12, column 9 to line 12, column 21 in times_overflow_exactly_2_31
invariant:
  exit: 75
  transcript: |-
    2178:0 Overflow when computing 65536*32768
    2178:0 Overflow when computing 65536*32768
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in times_overflow_exactly_2_31
    1. Line 16, column 8 to line 16, column 32 in times_overflow_exactly_2_31
    2. Line 16, column 29 to line 16, column 32 in times_overflow_exactly_2_31
    3. Line 12, column 9 to line 12, column 25 in times_overflow_exactly_2_31
    4. Line 12, column 9 to line 12, column 21 in times_overflow_exactly_2_31
property:
  exit: 75
  transcript: |-
    2178:0 Overflow when computing 65536*32768
    2178:0 Overflow when computing 65536*32768
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in times_overflow_exactly_2_31
    1. Line 15, column 12 to line 15, column 36 in times_overflow_exactly_2_31
    2. Line 15, column 33 to line 15, column 36 in times_overflow_exactly_2_31
    3. Line 12, column 9 to line 12, column 25 in times_overflow_exactly_2_31
    4. Line 12, column 9 to line 12, column 21 in times_overflow_exactly_2_31
---*)
