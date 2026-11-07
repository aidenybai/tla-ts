(*---
description: Adding two negatives past -2^31 overflows, printed with the negative operand.
ref: tlc2/module/Naturals.java#Plus
features:
  - Naturals
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE plus_overflow_negative ----
EXTENDS Naturals
Test == (0 - 2147483647 - 1) + (0 - 1) = 0
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing -2147483648+-1
    2178:0 Overflow when computing -2147483648+-1
init:
  exit: 75
  transcript: |-
    2178:0 Overflow when computing -2147483648+-1
    2178:0 Overflow when computing -2147483648+-1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in plus_overflow_negative
    1. Line 14, column 29 to line 14, column 32 in plus_overflow_negative
    2. Line 12, column 9 to line 12, column 42 in plus_overflow_negative
    3. Line 12, column 9 to line 12, column 38 in plus_overflow_negative
next:
  exit: 255
  transcript: |-
    2178:1 Overflow when computing -2147483648+-1
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in plus_overflow_negative
    1. Line 15, column 30 to line 15, column 33 in plus_overflow_negative
    2. Line 12, column 9 to line 12, column 42 in plus_overflow_negative
    3. Line 12, column 9 to line 12, column 38 in plus_overflow_negative
invariant:
  exit: 75
  transcript: |-
    2178:0 Overflow when computing -2147483648+-1
    2178:0 Overflow when computing -2147483648+-1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in plus_overflow_negative
    1. Line 16, column 8 to line 16, column 32 in plus_overflow_negative
    2. Line 16, column 29 to line 16, column 32 in plus_overflow_negative
    3. Line 12, column 9 to line 12, column 42 in plus_overflow_negative
    4. Line 12, column 9 to line 12, column 38 in plus_overflow_negative
property:
  exit: 75
  transcript: |-
    2178:0 Overflow when computing -2147483648+-1
    2178:0 Overflow when computing -2147483648+-1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in plus_overflow_negative
    1. Line 15, column 12 to line 15, column 36 in plus_overflow_negative
    2. Line 15, column 33 to line 15, column 36 in plus_overflow_negative
    3. Line 12, column 9 to line 12, column 42 in plus_overflow_negative
    4. Line 12, column 9 to line 12, column 38 in plus_overflow_negative
---*)
