(*---
description: Naturals.Divide lacks the overflow check of Integers.Divide, so -2^31 \div -1 silently wraps to -2^31. Real TLC bug.
ref: tlc2/module/Naturals.java#Divide
features:
  - Naturals
  - tlc-bug
flags:
  - expression
outcome: success
correct:
  assume:
    exit: 10
    transcript: |-
      2105:1 Evaluating assumption line 68, col 8 to line 68, col 11 of module div_min_by_minus_one_wraps failed.
      2178:0 Overflow when computing -2147483648 \div -1
  init:
    exit: 75
    transcript: |-
      1000:1 
      2178:0 Overflow when computing -2147483648 \div -1
      2103:1 The error occurred when TLC was evaluating the nested
      expressions at the following positions:
      0. Line 69, column 9 to line 69, column 32 in div_min_by_minus_one_wraps
      1. Line 69, column 29 to line 69, column 32 in div_min_by_minus_one_wraps
      2. Line 67, column 9 to line 67, column 64 in div_min_by_minus_one_wraps
      3. Line 67, column 9 to line 67, column 41 in div_min_by_minus_one_wraps
  invariant:
    exit: 75
    transcript: |-
      1000:1 
      2178:0 Overflow when computing -2147483648 \div -1
      2103:1 The error occurred when TLC was evaluating the nested
      expressions at the following positions:
      0. Line 69, column 9 to line 69, column 32 in div_min_by_minus_one_wraps
      1. Line 71, column 8 to line 71, column 32 in div_min_by_minus_one_wraps
      2. Line 71, column 29 to line 71, column 32 in div_min_by_minus_one_wraps
      3. Line 67, column 9 to line 67, column 64 in div_min_by_minus_one_wraps
      4. Line 67, column 9 to line 67, column 41 in div_min_by_minus_one_wraps
  next:
    exit: 255
    transcript: |-
      2178:1 Overflow when computing -2147483648 \div -1
      2121:1 The behavior up to this point is:
      2217:4 1: <Initial predicate>
      conformance_state = TRUE
      2103:1 The error occurred when TLC was evaluating the nested
      expressions at the following positions:
      0. Line 70, column 9 to line 70, column 33 in div_min_by_minus_one_wraps
      1. Line 70, column 30 to line 70, column 33 in div_min_by_minus_one_wraps
      2. Line 67, column 9 to line 67, column 64 in div_min_by_minus_one_wraps
      3. Line 67, column 9 to line 67, column 41 in div_min_by_minus_one_wraps
  property:
    exit: 75
    transcript: |-
      1000:1 
      2178:0 Overflow when computing -2147483648 \div -1
      2103:1 The error occurred when TLC was evaluating the nested
      expressions at the following positions:
      0. Line 69, column 9 to line 69, column 32 in div_min_by_minus_one_wraps
      1. Line 70, column 12 to line 70, column 36 in div_min_by_minus_one_wraps
      2. Line 70, column 33 to line 70, column 36 in div_min_by_minus_one_wraps
      3. Line 67, column 9 to line 67, column 64 in div_min_by_minus_one_wraps
      4. Line 67, column 9 to line 67, column 41 in div_min_by_minus_one_wraps
---*)
---- MODULE div_min_by_minus_one_wraps ----
EXTENDS Naturals
Test == (0 - 2147483647 - 1) \div (0 - 1) = (0 - 2147483647 - 1)
====

(*--- recorded
all:
  exit: 0
---*)
