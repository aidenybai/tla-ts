(*---
description: "Adding past the largest integer overflows."
ref: "tlc2/module/Naturals.java#Plus"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE plus_past_max ----
EXTENDS Integers
Test == 2147483647 + 1 = 0
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2147483647+1
    2178:0 Overflow when computing 2147483647+1
init:
  exit: 75
  transcript: |-
    2178:0 Overflow when computing 2147483647+1
    2178:0 Overflow when computing 2147483647+1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in plus_past_max
    1. Line 11, column 29 to line 11, column 32 in plus_past_max
    2. Line 9, column 9 to line 9, column 26 in plus_past_max
    3. Line 9, column 9 to line 9, column 22 in plus_past_max
next:
  exit: 255
  transcript: |-
    2178:1 Overflow when computing 2147483647+1
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 33 in plus_past_max
    1. Line 12, column 30 to line 12, column 33 in plus_past_max
    2. Line 9, column 9 to line 9, column 26 in plus_past_max
    3. Line 9, column 9 to line 9, column 22 in plus_past_max
invariant:
  exit: 75
  transcript: |-
    2178:0 Overflow when computing 2147483647+1
    2178:0 Overflow when computing 2147483647+1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in plus_past_max
    1. Line 13, column 8 to line 13, column 32 in plus_past_max
    2. Line 13, column 29 to line 13, column 32 in plus_past_max
    3. Line 9, column 9 to line 9, column 26 in plus_past_max
    4. Line 9, column 9 to line 9, column 22 in plus_past_max
property:
  exit: 75
  transcript: |-
    2178:0 Overflow when computing 2147483647+1
    2178:0 Overflow when computing 2147483647+1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in plus_past_max
    1. Line 12, column 12 to line 12, column 36 in plus_past_max
    2. Line 12, column 33 to line 12, column 36 in plus_past_max
    3. Line 9, column 9 to line 9, column 26 in plus_past_max
    4. Line 9, column 9 to line 9, column 22 in plus_past_max
---*)
