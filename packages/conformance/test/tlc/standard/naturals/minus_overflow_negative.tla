(*---
description: Subtracting a positive past -2^31 overflows, naming the operands.
ref: tlc2/module/Naturals.java#Minus
features:
  - Naturals
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE minus_overflow_negative ----
EXTENDS Naturals
Test == (0 - 2147483647) - 2 = 0
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing -2147483647-2
    2178:0 Overflow when computing -2147483647-2
init:
  exit: 75
  transcript: |-
    2178:0 Overflow when computing -2147483647-2
    2178:0 Overflow when computing -2147483647-2
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in minus_overflow_negative
    1. Line 14, column 29 to line 14, column 32 in minus_overflow_negative
    2. Line 12, column 9 to line 12, column 32 in minus_overflow_negative
    3. Line 12, column 9 to line 12, column 28 in minus_overflow_negative
next:
  exit: 255
  transcript: |-
    2178:1 Overflow when computing -2147483647-2
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in minus_overflow_negative
    1. Line 15, column 30 to line 15, column 33 in minus_overflow_negative
    2. Line 12, column 9 to line 12, column 32 in minus_overflow_negative
    3. Line 12, column 9 to line 12, column 28 in minus_overflow_negative
invariant:
  exit: 75
  transcript: |-
    2178:0 Overflow when computing -2147483647-2
    2178:0 Overflow when computing -2147483647-2
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in minus_overflow_negative
    1. Line 16, column 8 to line 16, column 32 in minus_overflow_negative
    2. Line 16, column 29 to line 16, column 32 in minus_overflow_negative
    3. Line 12, column 9 to line 12, column 32 in minus_overflow_negative
    4. Line 12, column 9 to line 12, column 28 in minus_overflow_negative
property:
  exit: 75
  transcript: |-
    2178:0 Overflow when computing -2147483647-2
    2178:0 Overflow when computing -2147483647-2
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in minus_overflow_negative
    1. Line 15, column 12 to line 15, column 36 in minus_overflow_negative
    2. Line 15, column 33 to line 15, column 36 in minus_overflow_negative
    3. Line 12, column 9 to line 12, column 32 in minus_overflow_negative
    4. Line 12, column 9 to line 12, column 28 in minus_overflow_negative
---*)
