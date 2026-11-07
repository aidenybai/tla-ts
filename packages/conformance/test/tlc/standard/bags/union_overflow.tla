(*---
description: BagUnion overflows when counts add past 2^31-1.
ref: tlc2/module/Bags.java#addCounts
features:
  - Bags
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE union_overflow ----
EXTENDS Bags, TLC, Naturals
Test == BagUnion({1 :> 2147483647, 1 :> 1}) = EmptyBag
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 1+2147483647
    2178:0 Overflow when computing 1+2147483647
init:
  exit: 75
  transcript: |-
    2178:0 Overflow when computing 1+2147483647
    2178:0 Overflow when computing 1+2147483647
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in union_overflow
    1. Line 14, column 29 to line 14, column 32 in union_overflow
    2. Line 12, column 9 to line 12, column 54 in union_overflow
    3. Line 12, column 9 to line 12, column 43 in union_overflow
next:
  exit: 255
  transcript: |-
    2178:1 Overflow when computing 1+2147483647
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in union_overflow
    1. Line 15, column 30 to line 15, column 33 in union_overflow
    2. Line 12, column 9 to line 12, column 54 in union_overflow
    3. Line 12, column 9 to line 12, column 43 in union_overflow
invariant:
  exit: 75
  transcript: |-
    2178:0 Overflow when computing 1+2147483647
    2178:0 Overflow when computing 1+2147483647
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in union_overflow
    1. Line 16, column 8 to line 16, column 32 in union_overflow
    2. Line 16, column 29 to line 16, column 32 in union_overflow
    3. Line 12, column 9 to line 12, column 54 in union_overflow
    4. Line 12, column 9 to line 12, column 43 in union_overflow
property:
  exit: 75
  transcript: |-
    2178:0 Overflow when computing 1+2147483647
    2178:0 Overflow when computing 1+2147483647
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in union_overflow
    1. Line 15, column 12 to line 15, column 36 in union_overflow
    2. Line 15, column 33 to line 15, column 36 in union_overflow
    3. Line 12, column 9 to line 12, column 54 in union_overflow
    4. Line 12, column 9 to line 12, column 43 in union_overflow
---*)
