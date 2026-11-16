(*---
description: Two large positive numbers whose wrapped sum is negative overflow.
ref: tlc2/module/Naturals.java#Plus
features:
  - Naturals
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE plus_overflow_positive_large ----
EXTENDS Naturals
Test == 2000000000 + 2000000000 = 0
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module plus_overflow_positive_large failed.
    2178:0 Overflow when computing 2000000000+2000000000
init:
  exit: 75
  transcript: |-
    1000:1 
    2178:0 Overflow when computing 2000000000+2000000000
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in plus_overflow_positive_large
    1. Line 14, column 29 to line 14, column 32 in plus_overflow_positive_large
    2. Line 12, column 9 to line 12, column 35 in plus_overflow_positive_large
    3. Line 12, column 9 to line 12, column 31 in plus_overflow_positive_large
next:
  exit: 255
  transcript: |-
    2178:1 Overflow when computing 2000000000+2000000000
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in plus_overflow_positive_large
    1. Line 15, column 30 to line 15, column 33 in plus_overflow_positive_large
    2. Line 12, column 9 to line 12, column 35 in plus_overflow_positive_large
    3. Line 12, column 9 to line 12, column 31 in plus_overflow_positive_large
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2178:0 Overflow when computing 2000000000+2000000000
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in plus_overflow_positive_large
    1. Line 16, column 8 to line 16, column 32 in plus_overflow_positive_large
    2. Line 16, column 29 to line 16, column 32 in plus_overflow_positive_large
    3. Line 12, column 9 to line 12, column 35 in plus_overflow_positive_large
    4. Line 12, column 9 to line 12, column 31 in plus_overflow_positive_large
property:
  exit: 75
  transcript: |-
    1000:1 
    2178:0 Overflow when computing 2000000000+2000000000
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in plus_overflow_positive_large
    1. Line 15, column 12 to line 15, column 36 in plus_overflow_positive_large
    2. Line 15, column 33 to line 15, column 36 in plus_overflow_positive_large
    3. Line 12, column 9 to line 12, column 35 in plus_overflow_positive_large
    4. Line 12, column 9 to line 12, column 31 in plus_overflow_positive_large
---*)
