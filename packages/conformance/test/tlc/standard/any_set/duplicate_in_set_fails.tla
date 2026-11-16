(*---
description: "{Any, Any} cannot be normalized, because comparing Any with itself throws."
ref: tlc2/module/AnySet.java#compareTo
features:
  - AnySet
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE duplicate_in_set_fails ----
EXTENDS TLC, FiniteSets
Test == Cardinality({Any, Any}) = 1
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module duplicate_in_set_fails failed.
    2155:0 Attempted to compare ANY with the value
    ANY
init:
  exit: 75
  transcript: |-
    1000:1 
    2155:0 Attempted to compare ANY with the value
    ANY
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in duplicate_in_set_fails
    1. Line 14, column 29 to line 14, column 32 in duplicate_in_set_fails
    2. Line 12, column 9 to line 12, column 35 in duplicate_in_set_fails
    3. Line 12, column 9 to line 12, column 31 in duplicate_in_set_fails
next:
  exit: 75
  transcript: |-
    2155:1 Attempted to compare ANY with the value
    ANY
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in duplicate_in_set_fails
    1. Line 15, column 30 to line 15, column 33 in duplicate_in_set_fails
    2. Line 12, column 9 to line 12, column 35 in duplicate_in_set_fails
    3. Line 12, column 9 to line 12, column 31 in duplicate_in_set_fails
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2155:0 Attempted to compare ANY with the value
    ANY
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in duplicate_in_set_fails
    1. Line 16, column 8 to line 16, column 32 in duplicate_in_set_fails
    2. Line 16, column 29 to line 16, column 32 in duplicate_in_set_fails
    3. Line 12, column 9 to line 12, column 35 in duplicate_in_set_fails
    4. Line 12, column 9 to line 12, column 31 in duplicate_in_set_fails
property:
  exit: 75
  transcript: |-
    1000:1 
    2155:0 Attempted to compare ANY with the value
    ANY
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in duplicate_in_set_fails
    1. Line 15, column 12 to line 15, column 36 in duplicate_in_set_fails
    2. Line 15, column 33 to line 15, column 36 in duplicate_in_set_fails
    3. Line 12, column 9 to line 12, column 35 in duplicate_in_set_fails
    4. Line 12, column 9 to line 12, column 31 in duplicate_in_set_fails
---*)
