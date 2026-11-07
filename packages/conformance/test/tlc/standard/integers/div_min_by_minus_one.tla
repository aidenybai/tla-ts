(*---
description: -2^31 \div -1 overflows with a fixed message, a check Naturals.Divide lacks.
ref: tlc2/module/Integers.java#Divide
features:
  - Integers
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE div_min_by_minus_one ----
EXTENDS Integers
Test == (-2147483647 - 1) \div (-1) = 0
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing -2147483648 \div -1
    2178:0 Overflow when computing -2147483648 \div -1
init:
  exit: 75
  transcript: |-
    2178:0 Overflow when computing -2147483648 \div -1
    2178:0 Overflow when computing -2147483648 \div -1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in div_min_by_minus_one
    1. Line 14, column 29 to line 14, column 32 in div_min_by_minus_one
    2. Line 12, column 9 to line 12, column 39 in div_min_by_minus_one
    3. Line 12, column 9 to line 12, column 35 in div_min_by_minus_one
next:
  exit: 255
  transcript: |-
    2178:1 Overflow when computing -2147483648 \div -1
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in div_min_by_minus_one
    1. Line 15, column 30 to line 15, column 33 in div_min_by_minus_one
    2. Line 12, column 9 to line 12, column 39 in div_min_by_minus_one
    3. Line 12, column 9 to line 12, column 35 in div_min_by_minus_one
invariant:
  exit: 75
  transcript: |-
    2178:0 Overflow when computing -2147483648 \div -1
    2178:0 Overflow when computing -2147483648 \div -1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in div_min_by_minus_one
    1. Line 16, column 8 to line 16, column 32 in div_min_by_minus_one
    2. Line 16, column 29 to line 16, column 32 in div_min_by_minus_one
    3. Line 12, column 9 to line 12, column 39 in div_min_by_minus_one
    4. Line 12, column 9 to line 12, column 35 in div_min_by_minus_one
property:
  exit: 75
  transcript: |-
    2178:0 Overflow when computing -2147483648 \div -1
    2178:0 Overflow when computing -2147483648 \div -1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in div_min_by_minus_one
    1. Line 15, column 12 to line 15, column 36 in div_min_by_minus_one
    2. Line 15, column 33 to line 15, column 36 in div_min_by_minus_one
    3. Line 12, column 9 to line 12, column 39 in div_min_by_minus_one
    4. Line 12, column 9 to line 12, column 35 in div_min_by_minus_one
---*)
