(*---
description: Negating -2^31 overflows with the literal message --2147483648.
ref: tlc2/module/Integers.java#Neg
features:
  - Integers
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE neg_min_overflow ----
EXTENDS Integers
Test == -(-2147483647 - 1) = 0
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing --2147483648
    2178:0 Overflow when computing --2147483648
init:
  exit: 75
  transcript: |-
    2178:0 Overflow when computing --2147483648
    2178:0 Overflow when computing --2147483648
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in neg_min_overflow
    1. Line 14, column 29 to line 14, column 32 in neg_min_overflow
    2. Line 12, column 9 to line 12, column 30 in neg_min_overflow
    3. Line 12, column 9 to line 12, column 26 in neg_min_overflow
next:
  exit: 255
  transcript: |-
    2178:1 Overflow when computing --2147483648
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in neg_min_overflow
    1. Line 15, column 30 to line 15, column 33 in neg_min_overflow
    2. Line 12, column 9 to line 12, column 30 in neg_min_overflow
    3. Line 12, column 9 to line 12, column 26 in neg_min_overflow
invariant:
  exit: 75
  transcript: |-
    2178:0 Overflow when computing --2147483648
    2178:0 Overflow when computing --2147483648
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in neg_min_overflow
    1. Line 16, column 8 to line 16, column 32 in neg_min_overflow
    2. Line 16, column 29 to line 16, column 32 in neg_min_overflow
    3. Line 12, column 9 to line 12, column 30 in neg_min_overflow
    4. Line 12, column 9 to line 12, column 26 in neg_min_overflow
property:
  exit: 75
  transcript: |-
    2178:0 Overflow when computing --2147483648
    2178:0 Overflow when computing --2147483648
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in neg_min_overflow
    1. Line 15, column 12 to line 15, column 36 in neg_min_overflow
    2. Line 15, column 33 to line 15, column 36 in neg_min_overflow
    3. Line 12, column 9 to line 12, column 30 in neg_min_overflow
    4. Line 12, column 9 to line 12, column 26 in neg_min_overflow
---*)
