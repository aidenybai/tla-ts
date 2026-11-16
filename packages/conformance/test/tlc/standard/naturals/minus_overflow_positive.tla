(*---
description: Subtracting a negative past 2^31-1 overflows with a doubled minus in the message.
ref: tlc2/module/Naturals.java#Minus
features:
  - Naturals
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE minus_overflow_positive ----
EXTENDS Naturals
Test == 2147483647 - (0 - 1) = 0
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module minus_overflow_positive failed.
    2178:0 Overflow when computing 2147483647--1
init:
  exit: 75
  transcript: |-
    1000:1 
    2178:0 Overflow when computing 2147483647--1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in minus_overflow_positive
    1. Line 14, column 29 to line 14, column 32 in minus_overflow_positive
    2. Line 12, column 9 to line 12, column 32 in minus_overflow_positive
    3. Line 12, column 9 to line 12, column 28 in minus_overflow_positive
next:
  exit: 255
  transcript: |-
    2178:1 Overflow when computing 2147483647--1
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in minus_overflow_positive
    1. Line 15, column 30 to line 15, column 33 in minus_overflow_positive
    2. Line 12, column 9 to line 12, column 32 in minus_overflow_positive
    3. Line 12, column 9 to line 12, column 28 in minus_overflow_positive
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2178:0 Overflow when computing 2147483647--1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in minus_overflow_positive
    1. Line 16, column 8 to line 16, column 32 in minus_overflow_positive
    2. Line 16, column 29 to line 16, column 32 in minus_overflow_positive
    3. Line 12, column 9 to line 12, column 32 in minus_overflow_positive
    4. Line 12, column 9 to line 12, column 28 in minus_overflow_positive
property:
  exit: 75
  transcript: |-
    1000:1 
    2178:0 Overflow when computing 2147483647--1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in minus_overflow_positive
    1. Line 15, column 12 to line 15, column 36 in minus_overflow_positive
    2. Line 15, column 33 to line 15, column 36 in minus_overflow_positive
    3. Line 12, column 9 to line 12, column 32 in minus_overflow_positive
    4. Line 12, column 9 to line 12, column 28 in minus_overflow_positive
---*)
