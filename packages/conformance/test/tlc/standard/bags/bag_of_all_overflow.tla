(*---
description: A merge past 2^31-1 overflows.
ref: tlc2/module/Bags.java#addCounts
features:
  - Bags
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE bag_of_all_overflow ----
EXTENDS Bags, TLC, Naturals
Test == BagOfAll(LAMBDA x : x * 0, 1 :> 2147483647 @@ 2 :> 1) = EmptyBag
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2147483647+1
    2178:0 Overflow when computing 2147483647+1
init:
  exit: 75
  transcript: |-
    2178:0 Overflow when computing 2147483647+1
    2178:0 Overflow when computing 2147483647+1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in bag_of_all_overflow
    1. Line 14, column 29 to line 14, column 32 in bag_of_all_overflow
    2. Line 12, column 9 to line 12, column 72 in bag_of_all_overflow
    3. Line 12, column 9 to line 12, column 61 in bag_of_all_overflow
next:
  exit: 255
  transcript: |-
    2178:1 Overflow when computing 2147483647+1
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in bag_of_all_overflow
    1. Line 15, column 30 to line 15, column 33 in bag_of_all_overflow
    2. Line 12, column 9 to line 12, column 72 in bag_of_all_overflow
    3. Line 12, column 9 to line 12, column 61 in bag_of_all_overflow
invariant:
  exit: 75
  transcript: |-
    2178:0 Overflow when computing 2147483647+1
    2178:0 Overflow when computing 2147483647+1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in bag_of_all_overflow
    1. Line 16, column 8 to line 16, column 32 in bag_of_all_overflow
    2. Line 16, column 29 to line 16, column 32 in bag_of_all_overflow
    3. Line 12, column 9 to line 12, column 72 in bag_of_all_overflow
    4. Line 12, column 9 to line 12, column 61 in bag_of_all_overflow
property:
  exit: 75
  transcript: |-
    2178:0 Overflow when computing 2147483647+1
    2178:0 Overflow when computing 2147483647+1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in bag_of_all_overflow
    1. Line 15, column 12 to line 15, column 36 in bag_of_all_overflow
    2. Line 15, column 33 to line 15, column 36 in bag_of_all_overflow
    3. Line 12, column 9 to line 12, column 72 in bag_of_all_overflow
    4. Line 12, column 9 to line 12, column 61 in bag_of_all_overflow
---*)
