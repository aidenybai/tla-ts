(*---
description: A sum past 2^31-1 overflows.
ref: tlc2/module/Bags.java#addCounts
features:
  - Bags
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE cardinality_overflow ----
EXTENDS Bags, TLC, Naturals
Test == BagCardinality(1 :> 2147483647 @@ 2 :> 1) = 0
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
    0. Line 14, column 9 to line 14, column 32 in cardinality_overflow
    1. Line 14, column 29 to line 14, column 32 in cardinality_overflow
    2. Line 12, column 9 to line 12, column 53 in cardinality_overflow
    3. Line 12, column 9 to line 12, column 49 in cardinality_overflow
next:
  exit: 255
  transcript: |-
    2178:1 Overflow when computing 2147483647+1
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in cardinality_overflow
    1. Line 15, column 30 to line 15, column 33 in cardinality_overflow
    2. Line 12, column 9 to line 12, column 53 in cardinality_overflow
    3. Line 12, column 9 to line 12, column 49 in cardinality_overflow
invariant:
  exit: 75
  transcript: |-
    2178:0 Overflow when computing 2147483647+1
    2178:0 Overflow when computing 2147483647+1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in cardinality_overflow
    1. Line 16, column 8 to line 16, column 32 in cardinality_overflow
    2. Line 16, column 29 to line 16, column 32 in cardinality_overflow
    3. Line 12, column 9 to line 12, column 53 in cardinality_overflow
    4. Line 12, column 9 to line 12, column 49 in cardinality_overflow
property:
  exit: 75
  transcript: |-
    2178:0 Overflow when computing 2147483647+1
    2178:0 Overflow when computing 2147483647+1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in cardinality_overflow
    1. Line 15, column 12 to line 15, column 36 in cardinality_overflow
    2. Line 15, column 33 to line 15, column 36 in cardinality_overflow
    3. Line 12, column 9 to line 12, column 53 in cardinality_overflow
    4. Line 12, column 9 to line 12, column 49 in cardinality_overflow
---*)
