(*---
description: "With EXTENDS Integers, -2^31 \\div -1 reports an overflow, by a check for exactly these operands."
ref: "tlc2/module/Integers.java#Divide"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE div_min_by_minus_one_overflows ----
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
    0. Line 11, column 9 to line 11, column 32 in div_min_by_minus_one_overflows
    1. Line 11, column 29 to line 11, column 32 in div_min_by_minus_one_overflows
    2. Line 9, column 9 to line 9, column 39 in div_min_by_minus_one_overflows
    3. Line 9, column 9 to line 9, column 35 in div_min_by_minus_one_overflows
next:
  exit: 255
  transcript: |-
    2178:1 Overflow when computing -2147483648 \div -1
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 33 in div_min_by_minus_one_overflows
    1. Line 12, column 30 to line 12, column 33 in div_min_by_minus_one_overflows
    2. Line 9, column 9 to line 9, column 39 in div_min_by_minus_one_overflows
    3. Line 9, column 9 to line 9, column 35 in div_min_by_minus_one_overflows
invariant:
  exit: 75
  transcript: |-
    2178:0 Overflow when computing -2147483648 \div -1
    2178:0 Overflow when computing -2147483648 \div -1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in div_min_by_minus_one_overflows
    1. Line 13, column 8 to line 13, column 32 in div_min_by_minus_one_overflows
    2. Line 13, column 29 to line 13, column 32 in div_min_by_minus_one_overflows
    3. Line 9, column 9 to line 9, column 39 in div_min_by_minus_one_overflows
    4. Line 9, column 9 to line 9, column 35 in div_min_by_minus_one_overflows
property:
  exit: 75
  transcript: |-
    2178:0 Overflow when computing -2147483648 \div -1
    2178:0 Overflow when computing -2147483648 \div -1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in div_min_by_minus_one_overflows
    1. Line 12, column 12 to line 12, column 36 in div_min_by_minus_one_overflows
    2. Line 12, column 33 to line 12, column 36 in div_min_by_minus_one_overflows
    3. Line 9, column 9 to line 9, column 39 in div_min_by_minus_one_overflows
    4. Line 9, column 9 to line 9, column 35 in div_min_by_minus_one_overflows
---*)
