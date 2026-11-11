(*---
description: "With EXTENDS Naturals, -2^31 \\div -1 is 2^31, which TLC cannot represent, and instead of reporting an overflow it wraps to -2^31, because Naturals.Divide lacks the check in Integers.Divide."
ref: "tlc2/module/Naturals.java#Divide"
features: [tlc-bug]
flags: [expression]
outcome: success
correct:
  assume:
    exit: 10
    transcript: |-
      2105:1 Evaluating assumption line 65, col 8 to line 65, col 11 of module naturals_div_min_by_minus_one_wraps failed.
      2178:0 Overflow when computing -2147483648 \div -1
  init:
    exit: 75
    transcript: |-
      1000:1 
      2178:0 Overflow when computing -2147483648 \div -1
      2103:1 The error occurred when TLC was evaluating the nested
      expressions at the following positions:
      0. Line 66, column 9 to line 66, column 32 in naturals_div_min_by_minus_one_wraps
      1. Line 66, column 29 to line 66, column 32 in naturals_div_min_by_minus_one_wraps
      2. Line 64, column 9 to line 64, column 62 in naturals_div_min_by_minus_one_wraps
      3. Line 64, column 9 to line 64, column 41 in naturals_div_min_by_minus_one_wraps
  invariant:
    exit: 75
    transcript: |-
      1000:1 
      2178:0 Overflow when computing -2147483648 \div -1
      2103:1 The error occurred when TLC was evaluating the nested
      expressions at the following positions:
      0. Line 66, column 9 to line 66, column 32 in naturals_div_min_by_minus_one_wraps
      1. Line 68, column 8 to line 68, column 32 in naturals_div_min_by_minus_one_wraps
      2. Line 68, column 29 to line 68, column 32 in naturals_div_min_by_minus_one_wraps
      3. Line 64, column 9 to line 64, column 62 in naturals_div_min_by_minus_one_wraps
      4. Line 64, column 9 to line 64, column 41 in naturals_div_min_by_minus_one_wraps
  next:
    exit: 255
    transcript: |-
      2178:1 Overflow when computing -2147483648 \div -1
      2121:1 The behavior up to this point is:
      2217:4 1: <Initial predicate>
      conformance_state = TRUE
      2103:1 The error occurred when TLC was evaluating the nested
      expressions at the following positions:
      0. Line 67, column 9 to line 67, column 33 in naturals_div_min_by_minus_one_wraps
      1. Line 67, column 30 to line 67, column 33 in naturals_div_min_by_minus_one_wraps
      2. Line 64, column 9 to line 64, column 62 in naturals_div_min_by_minus_one_wraps
      3. Line 64, column 9 to line 64, column 41 in naturals_div_min_by_minus_one_wraps
  property:
    exit: 75
    transcript: |-
      1000:1 
      2178:0 Overflow when computing -2147483648 \div -1
      2103:1 The error occurred when TLC was evaluating the nested
      expressions at the following positions:
      0. Line 66, column 9 to line 66, column 32 in naturals_div_min_by_minus_one_wraps
      1. Line 67, column 12 to line 67, column 36 in naturals_div_min_by_minus_one_wraps
      2. Line 67, column 33 to line 67, column 36 in naturals_div_min_by_minus_one_wraps
      3. Line 64, column 9 to line 64, column 62 in naturals_div_min_by_minus_one_wraps
      4. Line 64, column 9 to line 64, column 41 in naturals_div_min_by_minus_one_wraps
---*)
---- MODULE naturals_div_min_by_minus_one_wraps ----
EXTENDS Naturals
Test == (0 - 2147483647 - 1) \div (0 - 1) = 0 - 2147483647 - 1
====

(*--- recorded
all:
  exit: 0
---*)
