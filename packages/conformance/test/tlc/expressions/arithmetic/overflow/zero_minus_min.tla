(*---
description: "0 minus the least integer overflows."
ref: "tlc2/module/Naturals.java#Minus"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE zero_minus_min ----
EXTENDS Integers
Test == 0 - (-2147483647 - 1) = 0
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 11 of module zero_minus_min failed.
    2178:0 Overflow when computing 0--2147483648
init:
  exit: 75
  transcript: |-
    1000:1 
    2178:0 Overflow when computing 0--2147483648
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in zero_minus_min
    1. Line 11, column 29 to line 11, column 32 in zero_minus_min
    2. Line 9, column 9 to line 9, column 33 in zero_minus_min
    3. Line 9, column 9 to line 9, column 29 in zero_minus_min
next:
  exit: 255
  transcript: |-
    2178:1 Overflow when computing 0--2147483648
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 33 in zero_minus_min
    1. Line 12, column 30 to line 12, column 33 in zero_minus_min
    2. Line 9, column 9 to line 9, column 33 in zero_minus_min
    3. Line 9, column 9 to line 9, column 29 in zero_minus_min
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2178:0 Overflow when computing 0--2147483648
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in zero_minus_min
    1. Line 13, column 8 to line 13, column 32 in zero_minus_min
    2. Line 13, column 29 to line 13, column 32 in zero_minus_min
    3. Line 9, column 9 to line 9, column 33 in zero_minus_min
    4. Line 9, column 9 to line 9, column 29 in zero_minus_min
property:
  exit: 75
  transcript: |-
    1000:1 
    2178:0 Overflow when computing 0--2147483648
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in zero_minus_min
    1. Line 12, column 12 to line 12, column 36 in zero_minus_min
    2. Line 12, column 33 to line 12, column 36 in zero_minus_min
    3. Line 9, column 9 to line 9, column 33 in zero_minus_min
    4. Line 9, column 9 to line 9, column 29 in zero_minus_min
---*)
