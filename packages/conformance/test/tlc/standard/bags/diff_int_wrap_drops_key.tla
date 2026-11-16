(*---
description: BagDiff subtracts with plain int arithmetic, so subtracting -1 from 2^31-1 wraps negative and removes the key, where the TLA+ definition overflows. Real TLC bug.
ref: tlc2/module/Bags.java#BagDiff
features:
  - Bags
  - tlc-bug
flags:
  - expression
outcome: success
correct:
  assume:
    exit: 10
    transcript: |-
      2105:1 Evaluating assumption line 68, col 8 to line 68, col 11 of module diff_int_wrap_drops_key failed.
      2178:0 Overflow when computing 2147483647--1
  init:
    exit: 75
    transcript: |-
      1000:1 
      2178:0 Overflow when computing 2147483647--1
      2103:1 The error occurred when TLC was evaluating the nested
      expressions at the following positions:
      0. Line 69, column 9 to line 69, column 32 in diff_int_wrap_drops_key
      1. Line 69, column 29 to line 69, column 32 in diff_int_wrap_drops_key
      2. Line 67, column 9 to line 67, column 50 in diff_int_wrap_drops_key
      3. Line 67, column 9 to line 67, column 39 in diff_int_wrap_drops_key
  invariant:
    exit: 75
    transcript: |-
      1000:1 
      2178:0 Overflow when computing 2147483647--1
      2103:1 The error occurred when TLC was evaluating the nested
      expressions at the following positions:
      0. Line 69, column 9 to line 69, column 32 in diff_int_wrap_drops_key
      1. Line 71, column 8 to line 71, column 32 in diff_int_wrap_drops_key
      2. Line 71, column 29 to line 71, column 32 in diff_int_wrap_drops_key
      3. Line 67, column 9 to line 67, column 50 in diff_int_wrap_drops_key
      4. Line 67, column 9 to line 67, column 39 in diff_int_wrap_drops_key
  next:
    exit: 255
    transcript: |-
      2178:1 Overflow when computing 2147483647--1
      2121:1 The behavior up to this point is:
      2217:4 1: <Initial predicate>
      conformance_state = TRUE
      2103:1 The error occurred when TLC was evaluating the nested
      expressions at the following positions:
      0. Line 70, column 9 to line 70, column 33 in diff_int_wrap_drops_key
      1. Line 70, column 30 to line 70, column 33 in diff_int_wrap_drops_key
      2. Line 67, column 9 to line 67, column 50 in diff_int_wrap_drops_key
      3. Line 67, column 9 to line 67, column 39 in diff_int_wrap_drops_key
  property:
    exit: 75
    transcript: |-
      1000:1 
      2178:0 Overflow when computing 2147483647--1
      2103:1 The error occurred when TLC was evaluating the nested
      expressions at the following positions:
      0. Line 69, column 9 to line 69, column 32 in diff_int_wrap_drops_key
      1. Line 70, column 12 to line 70, column 36 in diff_int_wrap_drops_key
      2. Line 70, column 33 to line 70, column 36 in diff_int_wrap_drops_key
      3. Line 67, column 9 to line 67, column 50 in diff_int_wrap_drops_key
      4. Line 67, column 9 to line 67, column 39 in diff_int_wrap_drops_key
---*)
---- MODULE diff_int_wrap_drops_key ----
EXTENDS Bags, TLC, Integers
Test == (1 :> 2147483647) (-) (1 :> -1) = EmptyBag
====

(*--- recorded
all:
  exit: 0
---*)
