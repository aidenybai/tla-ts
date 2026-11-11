(*---
description: Comparing Int with STRING goes through Integers.compareTo, which rejects it.
ref: tlc2/module/Integers.java#compareTo
features:
  - Integers
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE int_compared_with_string_set ----
EXTENDS Integers
Test == Int = STRING
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module int_compared_with_string_set failed.
    2155:0 Attempted to compare Int with the value
    STRING
init:
  exit: 75
  transcript: |-
    1000:1 
    2155:0 Attempted to compare Int with the value
    STRING
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in int_compared_with_string_set
    1. Line 14, column 29 to line 14, column 32 in int_compared_with_string_set
    2. Line 12, column 9 to line 12, column 20 in int_compared_with_string_set
next:
  exit: 255
  transcript: |-
    2155:1 Attempted to compare Int with the value
    STRING
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in int_compared_with_string_set
    1. Line 15, column 30 to line 15, column 33 in int_compared_with_string_set
    2. Line 12, column 9 to line 12, column 20 in int_compared_with_string_set
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2155:0 Attempted to compare Int with the value
    STRING
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in int_compared_with_string_set
    1. Line 16, column 8 to line 16, column 32 in int_compared_with_string_set
    2. Line 16, column 29 to line 16, column 32 in int_compared_with_string_set
    3. Line 12, column 9 to line 12, column 20 in int_compared_with_string_set
property:
  exit: 75
  transcript: |-
    1000:1 
    2155:0 Attempted to compare Int with the value
    STRING
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in int_compared_with_string_set
    1. Line 15, column 12 to line 15, column 36 in int_compared_with_string_set
    2. Line 15, column 33 to line 15, column 36 in int_compared_with_string_set
    3. Line 12, column 9 to line 12, column 20 in int_compared_with_string_set
---*)
