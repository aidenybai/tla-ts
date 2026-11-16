(*---
description: "-65536 * 32768 parses as -(65536 * 32768), so the positive product overflows although the negated value would fit."
ref: "tlc2/module/Naturals.java#Times"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE prefix_minus_applies_after_times ----
EXTENDS Integers
Test == -65536 * 32768 = 0
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 11 of module prefix_minus_applies_after_times failed.
    2178:0 Overflow when computing 65536*32768
init:
  exit: 75
  transcript: |-
    1000:1 
    2178:0 Overflow when computing 65536*32768
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in prefix_minus_applies_after_times
    1. Line 11, column 29 to line 11, column 32 in prefix_minus_applies_after_times
    2. Line 9, column 9 to line 9, column 26 in prefix_minus_applies_after_times
    3. Line 9, column 9 to line 9, column 22 in prefix_minus_applies_after_times
    4. Line 9, column 10 to line 9, column 22 in prefix_minus_applies_after_times
next:
  exit: 255
  transcript: |-
    2178:1 Overflow when computing 65536*32768
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 33 in prefix_minus_applies_after_times
    1. Line 12, column 30 to line 12, column 33 in prefix_minus_applies_after_times
    2. Line 9, column 9 to line 9, column 26 in prefix_minus_applies_after_times
    3. Line 9, column 9 to line 9, column 22 in prefix_minus_applies_after_times
    4. Line 9, column 10 to line 9, column 22 in prefix_minus_applies_after_times
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2178:0 Overflow when computing 65536*32768
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in prefix_minus_applies_after_times
    1. Line 13, column 8 to line 13, column 32 in prefix_minus_applies_after_times
    2. Line 13, column 29 to line 13, column 32 in prefix_minus_applies_after_times
    3. Line 9, column 9 to line 9, column 26 in prefix_minus_applies_after_times
    4. Line 9, column 9 to line 9, column 22 in prefix_minus_applies_after_times
    5. Line 9, column 10 to line 9, column 22 in prefix_minus_applies_after_times
property:
  exit: 75
  transcript: |-
    1000:1 
    2178:0 Overflow when computing 65536*32768
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in prefix_minus_applies_after_times
    1. Line 12, column 12 to line 12, column 36 in prefix_minus_applies_after_times
    2. Line 12, column 33 to line 12, column 36 in prefix_minus_applies_after_times
    3. Line 9, column 9 to line 9, column 26 in prefix_minus_applies_after_times
    4. Line 9, column 9 to line 9, column 22 in prefix_minus_applies_after_times
    5. Line 9, column 10 to line 9, column 22 in prefix_minus_applies_after_times
---*)
