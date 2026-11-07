(*---
description: "A product of exactly 2^31 overflows."
ref: "tlc2/module/Naturals.java#Times"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE times_two_to_31 ----
EXTENDS Integers
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
    0. Line 11, column 9 to line 11, column 32 in times_two_to_31
    1. Line 11, column 29 to line 11, column 32 in times_two_to_31
    2. Line 9, column 9 to line 9, column 25 in times_two_to_31
    3. Line 9, column 9 to line 9, column 21 in times_two_to_31
next:
  exit: 255
  transcript: |-
    2178:1 Overflow when computing 65536*32768
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 33 in times_two_to_31
    1. Line 12, column 30 to line 12, column 33 in times_two_to_31
    2. Line 9, column 9 to line 9, column 25 in times_two_to_31
    3. Line 9, column 9 to line 9, column 21 in times_two_to_31
invariant:
  exit: 75
  transcript: |-
    2178:0 Overflow when computing 65536*32768
    2178:0 Overflow when computing 65536*32768
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in times_two_to_31
    1. Line 13, column 8 to line 13, column 32 in times_two_to_31
    2. Line 13, column 29 to line 13, column 32 in times_two_to_31
    3. Line 9, column 9 to line 9, column 25 in times_two_to_31
    4. Line 9, column 9 to line 9, column 21 in times_two_to_31
property:
  exit: 75
  transcript: |-
    2178:0 Overflow when computing 65536*32768
    2178:0 Overflow when computing 65536*32768
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in times_two_to_31
    1. Line 12, column 12 to line 12, column 36 in times_two_to_31
    2. Line 12, column 33 to line 12, column 36 in times_two_to_31
    3. Line 9, column 9 to line 9, column 25 in times_two_to_31
    4. Line 9, column 9 to line 9, column 21 in times_two_to_31
---*)
