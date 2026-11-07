(*---
description: "A set of records with more than 2^31 - 1 elements overflows when counted."
ref: "tlc2/value/impl/SetOfRcdsValue.java#size"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE size_overflow ----
EXTENDS Integers, FiniteSets
Test == Cardinality([a : 1..65536, b : 1..65536]) = 0
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing the number of elements in:
    [a: 1..65536, b: 1..65536]
    2178:0 Overflow when computing the number of elements in:
    [a: 1..65536, b: 1..65536]
    2178:0 Overflow when computing the number of elements in:
    [a: 1..65536, b: 1..65536]
init:
  exit: 75
  transcript: |-
    2178:0 Overflow when computing the number of elements in:
    [a: 1..65536, b: 1..65536]
    2178:0 Overflow when computing the number of elements in:
    [a: 1..65536, b: 1..65536]
    2178:0 Overflow when computing the number of elements in:
    [a: 1..65536, b: 1..65536]
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in size_overflow
    1. Line 11, column 29 to line 11, column 32 in size_overflow
    2. Line 9, column 9 to line 9, column 53 in size_overflow
    3. Line 9, column 9 to line 9, column 49 in size_overflow
next:
  exit: 75
  transcript: |-
    2178:0 Overflow when computing the number of elements in:
    [a: 1..65536, b: 1..65536]
    2178:0 Overflow when computing the number of elements in:
    [a: 1..65536, b: 1..65536]
    2178:0 Overflow when computing the number of elements in:
    [a: 1..65536, b: 1..65536]
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 33 in size_overflow
    1. Line 12, column 30 to line 12, column 33 in size_overflow
    2. Line 9, column 9 to line 9, column 53 in size_overflow
    3. Line 9, column 9 to line 9, column 49 in size_overflow
invariant:
  exit: 75
  transcript: |-
    2178:0 Overflow when computing the number of elements in:
    [a: 1..65536, b: 1..65536]
    2178:0 Overflow when computing the number of elements in:
    [a: 1..65536, b: 1..65536]
    | While working on the initial state:
    | conformance_state = TRUE
    2178:0 Overflow when computing the number of elements in:
    [a: 1..65536, b: 1..65536]
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in size_overflow
    1. Line 13, column 8 to line 13, column 32 in size_overflow
    2. Line 13, column 29 to line 13, column 32 in size_overflow
    3. Line 9, column 9 to line 9, column 53 in size_overflow
    4. Line 9, column 9 to line 9, column 49 in size_overflow
property:
  exit: 75
  transcript: |-
    2178:0 Overflow when computing the number of elements in:
    [a: 1..65536, b: 1..65536]
    2178:0 Overflow when computing the number of elements in:
    [a: 1..65536, b: 1..65536]
    | While working on the initial state:
    | conformance_state = TRUE
    2178:0 Overflow when computing the number of elements in:
    [a: 1..65536, b: 1..65536]
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in size_overflow
    1. Line 12, column 12 to line 12, column 36 in size_overflow
    2. Line 12, column 33 to line 12, column 36 in size_overflow
    3. Line 9, column 9 to line 9, column 53 in size_overflow
    4. Line 9, column 9 to line 9, column 49 in size_overflow
---*)
